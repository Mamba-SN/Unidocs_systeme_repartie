"""Utilitaires d'authentification JWT."""
import jwt
import datetime
from functools import wraps
from flask import request, jsonify, current_app


def generate_token(user):
    """Générer un token JWT pour un utilisateur."""
    payload = {
        "user_id": user.id,
        "role": user.role,
        "exp": datetime.datetime.now(datetime.timezone.utc)
        + datetime.timedelta(hours=current_app.config.get("JWT_EXPIRATION_HOURS", 24)),
        "iat": datetime.datetime.now(datetime.timezone.utc),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def _get_current_user_from_token():
    """Extraire et valider l'utilisateur courant à partir du header Authorization."""
    from models import Utilisateur

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, (jsonify({"error": "Token manquant"}), 401)

    token = auth_header.split(" ", 1)[1]

    try:
        payload = jwt.decode(
            token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
        )
        user = Utilisateur.query.get(payload["user_id"])
        if not user:
            return None, (jsonify({"error": "Utilisateur introuvable"}), 401)
        return user, None
    except jwt.ExpiredSignatureError:
        return None, (jsonify({"error": "Token expiré"}), 401)
    except jwt.InvalidTokenError:
        return None, (jsonify({"error": "Token invalide"}), 401)


def token_required(f):
    """Décorateur : route protégée par JWT."""

    @wraps(f)
    def decorated(*args, **kwargs):
        user, error = _get_current_user_from_token()
        if error:
            return error
        return f(user, *args, **kwargs)

    return decorated


def admin_required(f):
    """Décorateur : route réservée aux administrateurs."""

    @wraps(f)
    def decorated(*args, **kwargs):
        user, error = _get_current_user_from_token()
        if error:
            return error
        if user.role != "admin":
            return jsonify({"error": "Accès réservé aux administrateurs"}), 403
        return f(user, *args, **kwargs)

    return decorated
