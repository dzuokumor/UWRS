from backend.db import db
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import Report, User
import logging
import cloudinary.uploader

reports_bp = Blueprint("reports", __name__)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = current_app.config['FRONTEND_URL']
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

def validate_jwt_identity(current_user):
    if not isinstance(current_user, str):
        logging.error(f"JWT identity is not a string: {current_user} (type: {type(current_user)})")
        return None, None, "JWT identity must be a string"

    try:
        parts = current_user.split('-')
        if len(parts) != 2:
            raise ValueError
        user_id, user_role = parts
        return int(user_id), user_role, None
    except ValueError:
        logging.error(f"Invalid JWT identity format: {current_user}")
        return None, None, "Invalid JWT identity format (expected 'ID-ROLE')"

def check_user_verified(user_id):
    user = User.query.get(user_id)
    if not user or not user.is_verified:
        return False
    return True

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@reports_bp.route("/upload_image", methods=["POST", "OPTIONS"])
@jwt_required()
def upload_image():
    if request.method == "OPTIONS":
        return add_cors_headers(jsonify({"status": "ok"}))

    current_user = get_jwt_identity()
    user_id, _, error = validate_jwt_identity(current_user)
    if error or not check_user_verified(user_id):
        return add_cors_headers(jsonify({"error": "Unauthorized - User not verified"})), 401

    if 'file' not in request.files:
        return add_cors_headers(jsonify({"error": "No file provided"})), 400

    file = request.files['file']
    if file.filename == '':
        return add_cors_headers(jsonify({"error": "No selected file"})), 400
    if not allowed_file(file.filename):
        return add_cors_headers(jsonify({"error": "File type not allowed"})), 400

    try:
        upload_result = cloudinary.uploader.upload(
            file,
            upload_preset=current_app.config['CLOUDINARY_UPLOAD_PRESET'],
            folder="uwrs_reports"
        )
        return add_cors_headers(jsonify({
            "url": upload_result['secure_url'],
            "public_id": upload_result['public_id']
        })), 200
    except Exception as e:
        logging.error(f"Cloudinary upload error: {str(e)}")
        return add_cors_headers(jsonify({"error": "Failed to upload image"})), 500

@reports_bp.route("/submit_report", methods=["POST", "OPTIONS"])
@jwt_required()
def submit_report():
    global file
    if request.method == "OPTIONS":
        return add_cors_headers(jsonify({"status": "ok"}))

    current_user = get_jwt_identity()
    user_id, _, error = validate_jwt_identity(current_user)
    if error or not check_user_verified(user_id):
        return add_cors_headers(jsonify({"error": "Unauthorized - User not verified"})), 401

    if request.content_type.startswith('multipart/form-data'):
        if 'file' in request.files:
            file = request.files['file']
            if file.filename != '' and allowed_file(file.filename):
                try:
                    upload_result = cloudinary.uploader.upload(
                        file,
                        upload_preset=current_app.config['CLOUDINARY_UPLOAD_PRESET'],
                        folder="uwrs_reports"
                    )
                    image_url = upload_result['secure_url']
                except Exception as e:
                    logging.error(f"Image upload error: {str(e)}")
                    return add_cors_headers(jsonify({"error": "Failed to upload image"})), 500
            else:
                return add_cors_headers(jsonify({"error": "Invalid image file"})), 400
        else:
            image_url = None

        form_data = request.form
        latitude = form_data.get('latitude')
        longitude = form_data.get('longitude')
        description = form_data.get('description')
        file = request.files.get('file')

        if not description or not latitude or not longitude or not file:
            return jsonify({"error": "Missing required data"}), 400
    else:
        if not request.is_json:
            return add_cors_headers(jsonify({"error": "Request must be JSON or form-data"})), 415

        data = request.get_json()
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        description = data.get('description')
        image_url = data.get('image_url')

    if None in (latitude, longitude, description):
        return add_cors_headers(jsonify({"error": "Missing required fields"})), 400

    try:
        new_report = Report(
            user_id=user_id,
            latitude=float(latitude),
            longitude=float(longitude),
            description=str(description),
            image_url=image_url,
            status="pending"
        )

        db.session.add(new_report)
        db.session.commit()

        print(f"Description: {description}, Latitude: {latitude}, Longitude: {longitude}")
        print(f"File: {file.filename}")
        return add_cors_headers(jsonify({
            "message": "Waste report submitted successfully",
            "report_id": new_report.id
        })), 201

    except ValueError as e:
        logging.error(f"Data validation error: {str(e)}")
        return add_cors_headers(jsonify({"error": "Invalid latitude/longitude values"})), 400
    except Exception as e:
        logging.error(f"Database error: {str(e)}")
        db.session.rollback()
        return add_cors_headers(jsonify({"error": "Failed to submit report"})), 500

@reports_bp.route("/reports", methods=["GET", "OPTIONS"])
@jwt_required()
def get_all_reports():
    if request.method == "OPTIONS":
        return add_cors_headers(jsonify({"status": "ok"}))

    current_user = get_jwt_identity()
    user_id, _, error = validate_jwt_identity(current_user)
    if error or not check_user_verified(user_id):
        return add_cors_headers(jsonify({"error": "Unauthorized - User not verified"})), 401

    try:
        reports = Report.query.filter_by(status="pending").all()
        return add_cors_headers(jsonify([{
            "id": report.id,
            "latitude": report.latitude,
            "longitude": report.longitude,
            "description": report.description,
            "status": report.status,
            "image_url": report.image_url,
            "created_at": report.created_at.isoformat() if report.created_at else None
        } for report in reports])), 200
    except Exception as e:
        logging.error(f"Error fetching reports: {str(e)}")
        return add_cors_headers(jsonify({"error": "Failed to retrieve reports"})), 500

@reports_bp.route("/report/claim/<int:report_id>", methods=["PUT", "OPTIONS"])
@jwt_required()
def claim_report(report_id):
    current_user = get_jwt_identity()
    user_id, user_role, error = validate_jwt_identity(current_user)
    if error or not check_user_verified(user_id):
        return add_cors_headers(jsonify({"error": "Unauthorized - User not verified"})), 401

    try:
        user = User.query.get(user_id)
        if not user or user.user_type not in ["NGO", "Government"]:
            return add_cors_headers(jsonify({"error": "Only NGOs or Government organizations can claim reports"})), 403

        report = Report.query.get(report_id)
        if not report:
            return add_cors_headers(jsonify({"error": "Report not found"})), 404

        if report.claimed_by:
            return add_cors_headers(jsonify({"error": "This report has already been claimed"})), 400

        report.claimed_by = user_id
        report.status = "in progress"
        db.session.commit()

        return add_cors_headers(jsonify({"message": "Report claimed successfully"})), 200

    except Exception as e:
        logging.error(f"Claim report error: {str(e)}")
        db.session.rollback()
        return add_cors_headers(jsonify({"error": "Failed to claim report"})), 500

@reports_bp.route("/report/update/<int:report_id>", methods=["PUT", "OPTIONS"])
@jwt_required()
def update_report_status(report_id):
    current_user = get_jwt_identity()
    user_id, user_role, error = validate_jwt_identity(current_user)
    if error or not check_user_verified(user_id):
        return add_cors_headers(jsonify({"error": "Unauthorized - User not verified"})), 401

    try:
        data = request.get_json()
        if not data or "status" not in data:
            return add_cors_headers(jsonify({"error": "Status is required"})), 400

        new_status = data["status"]
        if new_status not in ["in progress", "cleaned"]:
            return add_cors_headers(jsonify({"error": "Invalid status"})), 400

        user = User.query.get(user_id)
        if not user or user.user_type not in ["NGO", "Government"]:
            return add_cors_headers(jsonify({"error": "Only NGOs or Government organizations can update reports"})), 403

        report = Report.query.get(report_id)
        if not report:
            return add_cors_headers(jsonify({"error": "Report not found"})), 404

        if report.claimed_by != user_id:
            return add_cors_headers(jsonify({"error": "You can only update reports you claimed"})), 403

        report.status = new_status
        db.session.commit()
        return add_cors_headers(jsonify({"message": "Report status updated successfully"})), 200

    except Exception as e:
        logging.error(f"Update status error: {str(e)}")
        db.session.rollback()
        return add_cors_headers(jsonify({"error": "Failed to update report status"})), 500