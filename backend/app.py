import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate

from config import config_by_name
from models import db


def create_app(config_overrides=None):
    """Factory : crée et configure l'application Flask."""
    env = os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_by_name[env])

    # Permettre de surcharger la config (utile pour les tests)
    if config_overrides:
        app.config.update(config_overrides)

    # Extensions
    db.init_app(app)
    Migrate(app, db)
    CORS(app)

    # Blueprints (import tardif pour éviter les imports circulaires)
    from routes import api
    app.register_blueprint(api)

    # Route santé
    @app.route("/health")
    def health():
        return jsonify({"status": "ok"}), 200

    # Créer les tables et le dossier uploads au démarrage (dev)
    with app.app_context():
        db.create_all()
        os.makedirs(app.config.get("UPLOAD_FOLDER", "uploads"), exist_ok=True)

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(host="0.0.0.0", port=5000)
