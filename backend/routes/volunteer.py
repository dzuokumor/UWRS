from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.db import db
from backend.models import VolunteerMovement, Report
import logging

volunteer_bp = Blueprint("volunteer", __name__)

def validate_jwt_identity(current_user):
    try:
        user_id, user_role = current_user.split('-')
        return int(user_id), user_role, None
    except ValueError:
        logging.error(f"Invalid JWT identity format: {current_user}")
        return None, None, "Invalid JWT identity format (expected 'ID-ROLE')"


@volunteer_bp.route("/volunteer/start/<int:report_id>", methods=["POST"])
@jwt_required()
def start_volunteer_movement(report_id):
    current_user = get_jwt_identity()
    user_id, user_role, error = validate_jwt_identity(current_user)
    if error:
        return jsonify({"error": error}), 400

    if user_role != "General":
        return jsonify({"error": "Only general users can start a volunteer movement"}), 403

    report = Report.query.get(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    existing_movement = VolunteerMovement.query.filter_by(report_id=report_id).first()
    if existing_movement:
        return jsonify({"error": "A volunteer movement for this report already exists"}), 400

    new_movement = VolunteerMovement(report_id=report_id, organizer_id=user_id)
    db.session.add(new_movement)
    db.session.commit()

    return jsonify({"message": "Volunteer movement started successfully"}), 201


@volunteer_bp.route("/volunteer/join/<int:report_id>", methods=["POST"])
@jwt_required()
def join_volunteer_movement(report_id):
    current_user = get_jwt_identity()
    user_id, user_role, error = validate_jwt_identity(current_user)
    if error:
        return jsonify({"error": error}), 400

    movement = VolunteerMovement.query.filter_by(report_id=report_id).first()
    if not movement:
        return jsonify({"error": "No active volunteer movement for this report"}), 404

    return jsonify({"message": "Successfully joined the volunteer movement"}), 200


@volunteer_bp.route("/volunteer/block/<int:report_id>", methods=["PUT"])
@jwt_required()
def block_volunteer_movement(report_id):
    current_user = get_jwt_identity()
    user_id, user_role, error = validate_jwt_identity(current_user)
    if error:
        return jsonify({"error": error}), 400

    if user_role != "Government":
        return jsonify({"error": "Only government organizations can block a volunteer movement"}), 403

    movement = VolunteerMovement.query.filter_by(report_id=report_id).first()
    if not movement:
        return jsonify({"error": "No active volunteer movement for this report"}), 404

    movement.status = "blocked"
    db.session.commit()

    return jsonify({"message": "Volunteer movement blocked successfully"}), 200


@volunteer_bp.route("/volunteer/unblock/<int:report_id>", methods=["PUT"])
@jwt_required()
def unblock_volunteer_movement(report_id):
    current_user = get_jwt_identity()
    user_id, user_role, error = validate_jwt_identity(current_user)
    if error:
        return jsonify({"error": error}), 400

    if user_role != "Government":
        return jsonify({"error": "Only government organizations can unblock a volunteer movement"}), 403

    movement = VolunteerMovement.query.filter_by(report_id=report_id).first()
    if not movement:
        return jsonify({"error": "No volunteer movement found for this report"}), 404

    if movement.status != "blocked":
        return jsonify({"error": "This volunteer movement is not blocked"}), 400

    movement.status = "active"
    db.session.commit()

    return jsonify({"message": "Volunteer movement unblocked successfully"}), 200
