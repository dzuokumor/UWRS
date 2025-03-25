from datetime import timedelta
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, decode_token
from backend.models import User, db
import random
import string
import json
import logging

auth_bp = Blueprint("auth", __name__)


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
    full_name = data["full_name"].strip()
    nickname = data.get("nickname", "").strip()
    password = data.get("password")

    if not "@" in email:
        return jsonify({"error": "Invalid email format"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    if "@ngo.com" in email:
        user_type = "NGO"
    elif "@gov.com" in email:
        user_type = "Government"
    else:
        user_type = "general"

    # Handle password logic
    role_code = None
    if user_type == "general":
        if not password or len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters"}), 400
        password_hash = generate_password_hash(password)
    else:
        role_code = generate_role_code()
        password_hash = ""

    try:
        new_user = User(
            full_name=full_name,
            nickname=nickname if nickname else None,
            email=email,
            password_hash=password_hash,
            user_type=user_type,
            role_code=role_code
        )

        db.session.add(new_user)
        db.session.commit()

        if role_code:
            save_role_code_to_file(email, role_code)

        return jsonify({
            "message": "User registered successfully",
            "user_type": user_type
        }), 201

    except Exception as e:
        db.session.rollback()
        logging.error(f"Registration error: {str(e)}")
        return jsonify({"error": "Failed to register user"}), 500


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
        # Don't reveal whether email exists
        return jsonify({"error": "Invalid credentials"}), 401

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
        access_token = create_access_token(
            identity=str(identity_data),
            expires_delta=timedelta(days=1)
        )

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