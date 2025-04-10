from datetime import timedelta, datetime
from flask import Blueprint, request, jsonify, url_for, current_app, redirect
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

        response = jsonify(message="Verification email sent successfully.")
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response

    except SMTPException as e:
        logging.error(f"SMTP Error sending to {user_email}: {str(e)}")
        response = jsonify(message="Failed to send verification email.")
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response

    except Exception as e:
        logging.error(f"Unexpected error sending to {user_email}: {str(e)}")
        response = jsonify(message="An unexpected error occurred.")
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response


@auth_bp.route("/signup", methods=["POST"])
def signup():
    if not request.is_json:
        response = jsonify({"error": "Request must be JSON"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        return response, 415

    try:
        data = request.get_json()
    except Exception as e:
        logging.error(f"JSON parse error: {str(e)}")
        response = jsonify({"error": "Invalid JSON"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        return response, 400

    required_fields = ["full_name", "email", "password"]
    if not all(data.get(field) for field in required_fields):
        response = jsonify({"error": f"Missing required fields: {', '.join(required_fields)}"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 400

    email = data["email"].strip().lower()
    if "@" not in email:
        response = jsonify({"error": "Invalid email format"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 400

    if User.query.filter_by(email=email).first():
        response = jsonify({"error": "Email already registered"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 409

    if len(data["password"]) < 8:
        response = jsonify({"error": "Password must be at least 8 characters"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 400


    is_special_user = data.get('is_special_user', False) or '@ngo.com' in email or '@gov.com' in email
    user_type = "ngo" if '@ngo.com' in email else "government" if '@gov.com' in email else "general"


    if is_special_user:
        role_code = generate_role_code()
        save_role_code_to_file(email, role_code)

        new_user = User(
            full_name=data["full_name"].strip(),
            nickname=data.get("nickname", "").strip(),
            email=email,
            password_hash=generate_password_hash(data["password"]),
            user_type=user_type,
            role_code=role_code,
            is_verified=True,
            created_at=datetime.utcnow()
        )
        db.session.add(new_user)
        db.session.commit()

        response = jsonify({
            "message": "Registration complete. Your login code has been generated.",
            "email": email
        })
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 201

    user_data = {
        "full_name": data["full_name"].strip(),
        "nickname": data.get("nickname", "").strip(),
        "email": email,
        "password_hash": generate_password_hash(data["password"]),
        "user_type": user_type,
        "created_at": datetime.utcnow().isoformat()
    }

    if not send_verification_email(email, user_data):
        response = jsonify({"error": "Failed to send verification email"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 503

    unverified_users[email] = user_data
    response = jsonify({
        "message": "Verification email sent. Please check your inbox.",
        "email": email
    })
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response, 202

@auth_bp.route("/validate-email", methods=["POST"])
def validate_email():
    if not request.is_json:
        response = jsonify({"error": "Request must be JSON"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 415

    data = request.get_json()
    email = data.get("email", "").strip().lower()

    if not email or "@" not in email:
        response = jsonify({"error": "Invalid email format"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 400

    if User.query.filter_by(email=email).first():
        response = jsonify({"status": "registered", "message": "Email is already registered"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 409

    if email in unverified_users:
        response = jsonify({"status": "pending", "message": "Email registration pending verification"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 202

    response = jsonify({"status": "available", "message": "Email is available for registration"})
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response, 200

@auth_bp.route("/verify-email/<token>", methods=["GET"])
def verify_email(token):
    try:
        serializer = get_serializer()
        user_data = serializer.loads(token, salt="email-confirm", max_age=1800)

        existing_user = User.query.filter_by(email=user_data["email"]).first()
        if existing_user:
            if existing_user.is_verified:
                return redirect(f"{current_app.config['FRONTEND_URL']}/verification/already-verified", code=302)
            else:
                existing_user.is_verified = True
                db.session.commit()

        else:
            new_user = User(
                full_name=user_data["full_name"],
                nickname=user_data.get("nickname"),
                email=user_data["email"],
                password_hash=user_data["password_hash"],
                user_type=user_data.get("user_type", "general"),
                is_verified=True,
                created_at=datetime.utcnow()
            )
            db.session.add(new_user)
            db.session.commit()

        if user_data["email"] in unverified_users:
            del unverified_users[user_data["email"]]

        return redirect(f"{current_app.config['FRONTEND_URL']}/verification/success", code=302)

    except SignatureExpired:
        return redirect(f"{current_app.config['FRONTEND_URL']}/verification/expired", code=302)
    except BadSignature:
        return redirect(f"{current_app.config['FRONTEND_URL']}/verification/invalid", code=302)
    except Exception as e:
        logging.error(f"Verification error: {str(e)}")
        return redirect(f"{current_app.config['FRONTEND_URL']}/verification/error", code=302)


@auth_bp.route("/resend-verification", methods=["POST"])
def resend_verification():
    email = request.json.get("email")
    if not email or email not in unverified_users:
        response = jsonify({"error": "No pending registration found"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 404

    if send_verification_email(email, unverified_users[email]):
        response = jsonify({"message": "New verification email sent"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 200

    response = jsonify({"error": "Failed to resend email"})
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response, 500


@auth_bp.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        response = jsonify({"status": "preflight"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response

    if not request.is_json:
        response = jsonify({"error": "Request must be JSON"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 415

    try:
        data = request.get_json()
    except Exception as e:
        logging.error(f"JSON parse error: {str(e)}")
        response = jsonify({"error": "Invalid JSON"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    role_code = data.get("role_code", "").strip()

    if not email:
        response = jsonify({"error": "Email is required"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 400

    user = User.query.filter_by(email=email).first()
    if not user:
        response = jsonify({"error": "Invalid credentials"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 401

    if not user.is_verified:
        response = jsonify({"error": "Please verify your email before logging in"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 403

    if user.user_type == "general":
        if not password:
            response = jsonify({"error": "Password is required"})
            response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
            response.headers.add("Access-Control-Allow-Credentials", "true")
            return response, 400
        if not check_password_hash(user.password_hash, password):
            response = jsonify({"error": "Invalid credentials"})
            response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
            response.headers.add("Access-Control-Allow-Credentials", "true")
            return response, 401
    else:
        if not role_code:
            response = jsonify({"error": "Role code is required"})
            response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
            response.headers.add("Access-Control-Allow-Credentials", "true")
            return response, 400
        if role_code != user.role_code:
            response = jsonify({"error": "Invalid credentials"})
            response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
            response.headers.add("Access-Control-Allow-Credentials", "true")
            return response, 401

    try:
        identity_data = f"{user.id}-{user.user_type}"
        access_token = create_access_token(identity=str(identity_data), expires_delta=timedelta(days=1))
        decoded = decode_token(access_token)
        if not isinstance(decoded['sub'], str):
            raise ValueError("Token subject is not a string")

        response = jsonify({
            "access_token": access_token,
            "role": user.user_type,
            "user_id": user.id,
            "email": user.email,
            "is_verified": user.is_verified
        })
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 200

    except Exception as e:
        logging.error(f"Token creation error: {str(e)}")
        response = jsonify({"error": "Login failed"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 500


@auth_bp.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    try:
        current_user = get_jwt_identity()
        if not isinstance(current_user, str):
            raise ValueError("JWT identity is not a string")

        user_id, user_role = current_user.split('-')

        response = jsonify({
            "user_id": int(user_id),
            "role": user_role
        })
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")

        return response, 200

    except Exception as e:
        logging.error(f"JWT verification error: {str(e)}")
        response = jsonify({"error": "Invalid token"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 401