from backend.db import db
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import Report, User
import logging

reports_bp = Blueprint("reports", __name__)


def validate_jwt_identity(current_user):
    """Helper function to validate and parse JWT identity"""
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


@reports_bp.route("/submit_report", methods=["POST"])
@jwt_required()
def submit_report():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 415

    try:
        data = request.get_json()
    except Exception as e:
        logging.error(f"JSON parsing error: {str(e)}")
        return jsonify({"error": "Invalid JSON"}), 400

    current_user = get_jwt_identity()
    logging.debug(f"Raw JWT identity: {current_user} (type: {type(current_user)})")

    user_id, user_role, error = validate_jwt_identity(current_user)
    if error:
        return jsonify({"error": error}), 400

    required_fields = ["latitude", "longitude", "description"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": f"Missing required fields: {', '.join(required_fields)}"}), 400

    try:
        new_report = Report(
            user_id=user_id,
            latitude=float(data["latitude"]),
            longitude=float(data["longitude"]),
            description=str(data["description"]),
            image_url=data.get("image_url")
        )

        db.session.add(new_report)
        db.session.commit()
        return jsonify({"message": "Waste report submitted successfully"}), 201

    except ValueError as e:
        logging.error(f"Data validation error: {str(e)}")
        return jsonify({"error": "Invalid latitude/longitude values"}), 400
    except Exception as e:
        logging.error(f"Database error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to submit report"}), 500


@reports_bp.route("/reports", methods=["GET"])
@jwt_required()
def get_all_reports():
    try:
        reports = Report.query.all()
        return jsonify([{
            "id": report.id,
            "latitude": report.latitude,
            "longitude": report.longitude,
            "description": report.description,
            "status": report.status,
            "claimed_by": report.claimed_by,
            "image_url": report.image_url,
            "created_at": report.created_at.isoformat() if report.created_at else None
        } for report in reports]), 200
    except Exception as e:
        logging.error(f"Error fetching reports: {str(e)}")
        return jsonify({"error": "Failed to retrieve reports"}), 500


@reports_bp.route("/report/claim/<int:report_id>", methods=["PUT"])
@jwt_required()
def claim_report(report_id):
    current_user = get_jwt_identity()
    user_id, user_role, error = validate_jwt_identity(current_user)
    if error:
        return jsonify({"error": error}), 400

    try:
        user = User.query.get(user_id)
        if not user or user.user_type not in ["NGO", "Government"]:
            return jsonify({"error": "Only NGOs or Government organizations can claim reports"}), 403

        report = Report.query.get(report_id)
        if not report:
            return jsonify({"error": "Report not found"}), 404

        if report.claimed_by:
            return jsonify({"error": "This report has already been claimed"}), 400

        report.claimed_by = user_id
        report.status = "in progress"
        db.session.commit()

        return jsonify({"message": "Report claimed successfully"}), 200

    except Exception as e:
        logging.error(f"Claim report error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to claim report"}), 500


@reports_bp.route("/report/update/<int:report_id>", methods=["PUT"])
@jwt_required()
def update_report_status(report_id):
    current_user = get_jwt_identity()
    user_id, user_role, error = validate_jwt_identity(current_user)
    if error:
        return jsonify({"error": error}), 400

    try:
        data = request.get_json()
        if not data or "status" not in data:
            return jsonify({"error": "Status is required"}), 400

        new_status = data["status"]
        if new_status not in ["in progress", "cleaned"]:
            return jsonify({"error": "Invalid status"}), 400

        user = User.query.get(user_id)
        if not user or user.user_type not in ["NGO", "Government"]:
            return jsonify({"error": "Only NGOs or Government organizations can update reports"}), 403

        report = Report.query.get(report_id)
        if not report:
            return jsonify({"error": "Report not found"}), 404

        if report.claimed_by != user_id:
            return jsonify({"error": "You can only update reports you claimed"}), 403

        report.status = new_status
        db.session.commit()
        return jsonify({"message": "Report status updated successfully"}), 200

    except Exception as e:
        logging.error(f"Update status error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to update report status"}), 500