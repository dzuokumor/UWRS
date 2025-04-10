from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.db import db
from backend.models import VolunteerMovement, VolunteerParticipant
import logging
from datetime import datetime
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

    existing_movement = VolunteerMovement.query.filter_by(report_id=report_id).first()
    if existing_movement:
        return jsonify({"error": "A volunteer movement is already active for this report"}), 400

    needed_volunteers = request.json.get("needed_volunteers")
    scheduled_date = request.json.get("scheduled_date")

    if not needed_volunteers or not scheduled_date:
        return jsonify({"error": "Both needed_volunteers and scheduled_date are required"}), 400

    try:
        scheduled_date = datetime.strptime(scheduled_date, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return jsonify({"error": "Invalid scheduled date format. Use 'YYYY-MM-DD HH:MM:SS"}), 400

    new_movement = VolunteerMovement(
        report_id=report_id,
        organizer_id=user_id,
        needed_volunteers=needed_volunteers,
        scheduled_date=scheduled_date,
        created_at=datetime.utcnow(),
        status="active"
    )

    try:
        db.session.add(new_movement)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

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

    participant = VolunteerParticipant(movement_id=movement.id, user_id=user_id)
    db.session.add(participant)
    db.session.commit()

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


@volunteer_bp.route("/volunteer/active-movements", methods=["GET"])
def get_active_volunteer_movements():
    active_movements = VolunteerMovement.query.filter_by(status="active").all()

    movements_data = [
        {
            "id": movement.id,
            "report_id": movement.report_id,
            "organizer_id": movement.organizer_id,
            "needed_volunteers": movement.needed_volunteers,
            "scheduled_date": movement.scheduled_date.strftime("%Y-%m-%d"),
            "created_at": movement.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for movement in active_movements
    ]

    return jsonify(movements_data), 200