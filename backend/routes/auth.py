from datetime import timedelta, datetime
from flask import Blueprint, request, jsonify, url_for, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, decode_token
from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
import random
import string
import json
import logging
from backend.models import User, db
from smtplib import SMTPException

auth_bp = Blueprint("auth", __name__)

unverified_users = {}


def generate_role_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


def save_role_code_to_file(email, role_code):
    try:
        with open('codes.json', 'r') as f:
            codes = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        codes = {}
    codes[email] = role_code
    with open('codes.json', 'w') as f:
        json.dump(codes, f, indent=4)


def get_serializer():
    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'])


def send_verification_email(user_email, user_data):
    from backend.app import mail
    try:
        serializer = get_serializer()
        token = serializer.dumps(user_data, salt="email-confirm")
        confirm_url = url_for("auth.verify_email", token=token, _external=True)

        msg = Message(
            subject="Verify Your UWRS Account",
            sender=current_app.config['MAIL_DEFAULT_SENDER'],
            recipients=[user_email],
            html=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #2c3e50;">Welcome to UWRS!</h2>
                <p>Please verify your email address to complete registration:</p>
                <a href="{confirm_url}" 
                   style="background-color: #3498db; 
                          color: white; 
                          padding: 10px 20px; 
                          text-decoration: none; 
                          border-radius: 5px;
                          display: inline-block;">
                    Verify Email
                </a>
                <p style="margin-top: 20px;">
                    <small>Link expires in 30 minutes. If you didn't request this, please ignore.</small>
                </p>
            </div>
            """,
            body=f"""Please verify your UWRS account by visiting:\n{confirm_url}"""
        )

        mail.send(msg)
        logging.info(f"Verification email sent to {user_email}")
        return True

    except SMTPException as e:
        logging.error(f"SMTP Error sending to {user_email}: {str(e)}")
        return False
    except Exception as e:
        logging.error(f"Unexpected error sending to {user_email}: {str(e)}")
        return False


@auth_bp.route("/signup", methods=["POST"])
def signup():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 415

    try:
        data = request.get_json()
    except Exception as e:
        logging.error(f"JSON parse error: {str(e)}")
        return jsonify({"error": "Invalid JSON"}), 400

    required_fields = ["full_name", "email"]
    if not all(data.get(field) for field in required_fields):
        return jsonify({"error": f"Missing required fields: {', '.join(required_fields)}"}), 400

    email = data["email"].strip().lower()
    if "@" not in email:
        return jsonify({"error": "Invalid email format"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    if "@ngo.com" in email:
        user_type = "NGO"
    elif "@gov.com" in email:
        user_type = "Government"
    else:
        user_type = "general"

    if user_type != "general":
        role_code = generate_role_code()
        password_hash = ""
        save_role_code_to_file(email, role_code)
        new_user = User(
            full_name=data["full_name"].strip(),
            nickname=data.get("nickname", "").strip(),
            email=email,
            password_hash=password_hash,
            user_type=user_type,
            role_code=role_code,
            is_verified=True
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Registration successful"}), 201

    if not data.get("password") or len(data["password"]) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    user_data = {
        "full_name": data["full_name"].strip(),
        "nickname": data.get("nickname", "").strip(),
        "email": email,
        "password_hash": generate_password_hash(data["password"]),
        "user_type": "general",
        "created_at": datetime.utcnow().isoformat()
    }

    if not send_verification_email(email, user_data):
        return jsonify({"error": "Failed to send verification email"}), 503

    unverified_users[email] = user_data
    return jsonify({
        "message": "Verification email sent. Please check your inbox.",
        "resend_url": url_for("auth.resend_verification", email=email, _external=True)
    }), 202


@auth_bp.route("/verify-email/<token>", methods=["GET"])
def verify_email(token):
    try:
        serializer = get_serializer()
        user_data = serializer.loads(token, salt="email-confirm", max_age=1800)  # 30 min expiry

        if User.query.filter_by(email=user_data["email"]).first():
            return jsonify({"message": "Email already verified"}), 200

        new_user = User(
            full_name=user_data["full_name"],
            nickname=user_data["nickname"] if user_data["nickname"] else None,
            email=user_data["email"],
            password_hash=user_data["password_hash"],
            user_type=user_data["user_type"],
            is_verified=True
        )
        db.session.add(new_user)
        db.session.commit()

        if user_data["email"] in unverified_users:
            del unverified_users[user_data["email"]]

        return jsonify({
            "message": "Email verified successfully!",
            "login_url": url_for("auth.login", _external=True)
        }), 201

    except SignatureExpired:
        return jsonify({"error": "Verification link expired"}), 400
    except BadSignature:
        return jsonify({"error": "Invalid verification link"}), 400
    except Exception as e:
        logging.error(f"Verification error: {str(e)}")
        return jsonify({"error": "Verification failed"}), 500


@auth_bp.route("/resend-verification", methods=["POST"])
def resend_verification():
    email = request.json.get("email")
    if not email or email not in unverified_users:
        return jsonify({"error": "No pending registration found"}), 404

    if send_verification_email(email, unverified_users[email]):
        return jsonify({"message": "New verification email sent"}), 200
    return jsonify({"error": "Failed to resend email"}), 500
@auth_bp.route("/login", methods=["POST"])
def login():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 415
    try:
        data = request.get_json()
    except Exception as e:
        logging.error(f"JSON parse error: {str(e)}")
        return jsonify({"error": "Invalid JSON"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    role_code = data.get("role_code", "").strip()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    if not user.is_verified:
        return jsonify({"error": "Please verify your email before logging in"}), 403

    if user.user_type == "general":
        if not password:
            return jsonify({"error": "Password is required"}), 400
        if not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid credentials"}), 401
    else:
        if not role_code:
            return jsonify({"error": "Role code is required"}), 400
        if role_code != user.role_code:
            return jsonify({"error": "Invalid credentials"}), 401

    try:
        identity_data = f"{user.id}-{user.user_type}"
        access_token = create_access_token(identity=str(identity_data), expires_delta=timedelta(days=1))
        decoded = decode_token(access_token)
        if not isinstance(decoded['sub'], str):
            raise ValueError("Token subject is not a string")
        return jsonify({
            "access_token": access_token,
            "role": user.user_type,
            "user_id": user.id
        }), 200
    except Exception as e:
        logging.error(f"Token creation error: {str(e)}")
        return jsonify({"error": "Login failed"}), 500


@auth_bp.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    try:
        current_user = get_jwt_identity()
        if not isinstance(current_user, str):
            raise ValueError("JWT identity is not a string")
        user_id, user_role = current_user.split('-')
        return jsonify({
            "user_id": int(user_id),
            "role": user_role
        }), 200
    except Exception as e:
        logging.error(f"JWT verification error: {str(e)}")
        return jsonify({"error": "Invalid token"}), 401