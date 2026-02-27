"""Routes API — partage de documents universitaires."""
import os
import uuid

from flask import Blueprint, request, jsonify, send_from_directory, current_app
from werkzeug.utils import secure_filename

from models import db, Utilisateur, Universite, Filiere, Matiere, Document, Vote
from auth import generate_token, token_required, admin_required

api = Blueprint("api", __name__, url_prefix="/api")


def _allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in current_app.config["ALLOWED_EXTENSIONS"]
    )


# ══════════════════════════════════════════════
#  AUTHENTIFICATION
# ══════════════════════════════════════════════


@api.route("/auth/register", methods=["POST"])
def register():
    """Inscription d'un nouvel utilisateur."""
    data = request.get_json()
    required = ["nom", "prenom", "email", "mot_de_passe"]
    if not data or not all(data.get(f) for f in required):
        return jsonify({"error": "Champs requis : nom, prenom, email, mot_de_passe"}), 400

    if Utilisateur.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Cet email est déjà utilisé"}), 409

    user = Utilisateur(
        nom=data["nom"],
        prenom=data["prenom"],
        email=data["email"],
        role=data.get("role", "etudiant"),
        universite_id=data.get("universite_id"),
        filiere_id=data.get("filiere_id"),
        niveau=data.get("niveau"),
    )
    user.set_password(data["mot_de_passe"])
    db.session.add(user)
    db.session.commit()

    token = generate_token(user)
    return jsonify({"token": token, "utilisateur": user.to_dict()}), 201


@api.route("/auth/login", methods=["POST"])
def login():
    """Connexion d'un utilisateur."""
    data = request.get_json()
    if not data or not data.get("email") or not data.get("mot_de_passe"):
        return jsonify({"error": "Email et mot de passe requis"}), 400

    user = Utilisateur.query.filter_by(email=data["email"]).first()
    if not user or not user.check_password(data["mot_de_passe"]):
        return jsonify({"error": "Email ou mot de passe incorrect"}), 401

    token = generate_token(user)
    return jsonify({"token": token, "utilisateur": user.to_dict()}), 200


@api.route("/auth/me", methods=["GET"])
@token_required
def get_me(current_user):
    """Récupérer le profil de l'utilisateur connecté."""
    return jsonify(current_user.to_dict()), 200


# ══════════════════════════════════════════════
#  UNIVERSITÉS
# ══════════════════════════════════════════════


@api.route("/universites", methods=["GET"])
def get_universites():
    """Lister toutes les universités."""
    universites = Universite.query.order_by(Universite.nom).all()
    return jsonify([u.to_dict() for u in universites]), 200


@api.route("/universites/<int:uid>", methods=["GET"])
def get_universite(uid):
    """Détails d'une université + ses filières."""
    u = Universite.query.get_or_404(uid)
    data = u.to_dict()
    data["filieres"] = [f.to_dict() for f in u.filieres]
    return jsonify(data), 200


# ══════════════════════════════════════════════
#  FILIÈRES
# ══════════════════════════════════════════════


@api.route("/filieres", methods=["GET"])
def get_filieres():
    """Lister les filières (filtrable par universite_id)."""
    universite_id = request.args.get("universite_id", type=int)
    query = Filiere.query
    if universite_id:
        query = query.filter_by(universite_id=universite_id)
    return jsonify([f.to_dict() for f in query.order_by(Filiere.nom).all()]), 200


@api.route("/filieres/<int:fid>", methods=["GET"])
def get_filiere(fid):
    """Détails d'une filière + ses matières."""
    f = Filiere.query.get_or_404(fid)
    data = f.to_dict()
    data["matieres"] = [m.to_dict() for m in f.matieres]
    return jsonify(data), 200


# ══════════════════════════════════════════════
#  MATIÈRES
# ══════════════════════════════════════════════


@api.route("/matieres", methods=["GET"])
def get_matieres():
    """Lister les matières (filtrable par filiere_id, niveau)."""
    filiere_id = request.args.get("filiere_id", type=int)
    niveau = request.args.get("niveau")
    query = Matiere.query
    if filiere_id:
        query = query.filter_by(filiere_id=filiere_id)
    if niveau:
        query = query.filter_by(niveau=niveau)
    return jsonify([m.to_dict() for m in query.order_by(Matiere.nom).all()]), 200


@api.route("/matieres/<int:mid>", methods=["GET"])
def get_matiere(mid):
    """Détails d'une matière + ses documents."""
    m = Matiere.query.get_or_404(mid)
    data = m.to_dict()
    docs = (
        Document.query.filter_by(matiere_id=m.id, statut="approuve")
        .order_by(Document.created_at.desc())
        .all()
    )
    data["documents"] = [d.to_dict() for d in docs]
    return jsonify(data), 200


# ══════════════════════════════════════════════
#  DOCUMENTS
# ══════════════════════════════════════════════


@api.route("/documents", methods=["GET"])
def get_documents():
    """Lister les documents approuvés avec filtres et pagination."""
    matiere_id = request.args.get("matiere_id", type=int)
    type_doc = request.args.get("type")
    niveau = request.args.get("niveau")
    universite_id = request.args.get("universite_id", type=int)
    filiere_id = request.args.get("filiere_id", type=int)
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    query = Document.query.filter(Document.statut == "approuve")

    if matiere_id:
        query = query.filter(Document.matiere_id == matiere_id)
    if type_doc:
        query = query.filter(Document.type == type_doc)

    # Filtres nécessitant un join sur Matière / Filière
    if niveau or filiere_id or universite_id:
        query = query.join(Matiere)
        if niveau:
            query = query.filter(Matiere.niveau == niveau)
        if filiere_id:
            query = query.filter(Matiere.filiere_id == filiere_id)
        if universite_id:
            query = query.join(Filiere).filter(
                Filiere.universite_id == universite_id
            )

    pagination = query.order_by(Document.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify(
        {
            "documents": [d.to_dict() for d in pagination.items],
            "total": pagination.total,
            "page": pagination.page,
            "pages": pagination.pages,
            "per_page": per_page,
        }
    ), 200


@api.route("/documents/<int:did>", methods=["GET"])
def get_document(did):
    """Détails d'un document."""
    d = Document.query.get_or_404(did)
    return jsonify(d.to_dict()), 200


@api.route("/documents", methods=["POST"])
@token_required
def create_document(current_user):
    """Uploader un nouveau document (multipart/form-data)."""
    if "fichier" not in request.files:
        return jsonify({"error": "Aucun fichier envoyé"}), 400

    fichier = request.files["fichier"]
    if not fichier or fichier.filename == "":
        return jsonify({"error": "Nom de fichier vide"}), 400

    if not _allowed_file(fichier.filename):
        extensions = ", ".join(current_app.config["ALLOWED_EXTENSIONS"])
        return jsonify({"error": f"Format non autorisé. Formats acceptés : {extensions}"}), 400

    titre = request.form.get("titre")
    matiere_id = request.form.get("matiere_id", type=int)
    type_doc = request.form.get("type")

    if not titre or not matiere_id or not type_doc:
        return jsonify({"error": "Champs requis : titre, matiere_id, type"}), 400

    types_valides = ("cours", "examen", "td", "tp", "expose")
    if type_doc not in types_valides:
        return jsonify({"error": f"Type invalide. Valeurs : {', '.join(types_valides)}"}), 400

    # Sauvegarde fichier
    ext = fichier.filename.rsplit(".", 1)[1].lower()
    nom_stockage = f"{uuid.uuid4().hex}.{ext}"
    upload_dir = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_dir, exist_ok=True)
    chemin = os.path.join(upload_dir, nom_stockage)
    fichier.save(chemin)

    doc = Document(
        titre=titre,
        description=request.form.get("description", ""),
        type=type_doc,
        fichier_nom=secure_filename(fichier.filename),
        fichier_stockage=nom_stockage,
        taille=os.path.getsize(chemin),
        format=ext,
        annee_academique=request.form.get("annee_academique", ""),
        matiere_id=matiere_id,
        auteur_id=current_user.id,
        statut="approuve",  # auto-approuvé pour le MVP
    )
    db.session.add(doc)
    db.session.commit()
    return jsonify(doc.to_dict()), 201


@api.route("/documents/<int:did>/download", methods=["GET"])
def download_document(did):
    """Télécharger le fichier d'un document."""
    doc = Document.query.get_or_404(did)
    doc.nb_telechargements += 1
    db.session.commit()
    return send_from_directory(
        current_app.config["UPLOAD_FOLDER"],
        doc.fichier_stockage,
        as_attachment=True,
        download_name=doc.fichier_nom,
    )


@api.route("/documents/<int:did>", methods=["DELETE"])
@token_required
def delete_document(current_user, did):
    """Supprimer un document (auteur ou admin)."""
    doc = Document.query.get_or_404(did)
    if doc.auteur_id != current_user.id and current_user.role != "admin":
        return jsonify({"error": "Non autorisé"}), 403

    # Supprimer le fichier physique
    chemin = os.path.join(current_app.config["UPLOAD_FOLDER"], doc.fichier_stockage)
    if os.path.exists(chemin):
        os.remove(chemin)

    db.session.delete(doc)
    db.session.commit()
    return jsonify({"message": "Document supprimé"}), 200


# ══════════════════════════════════════════════
#  VOTES / NOTATION
# ══════════════════════════════════════════════


@api.route("/documents/<int:did>/vote", methods=["POST"])
@token_required
def vote_document(current_user, did):
    """Noter un document (1-5). Un seul vote par utilisateur."""
    doc = Document.query.get_or_404(did)
    data = request.get_json()
    note = data.get("note") if data else None

    if note is None or not isinstance(note, int) or note < 1 or note > 5:
        return jsonify({"error": "Note requise (entier entre 1 et 5)"}), 400

    vote = Vote.query.filter_by(
        document_id=did, utilisateur_id=current_user.id
    ).first()

    if vote:
        vote.note = note  # mise à jour
    else:
        vote = Vote(
            document_id=did, utilisateur_id=current_user.id, note=note
        )
        db.session.add(vote)

    db.session.commit()
    return jsonify({"note_moyenne": doc.note_moyenne, "vote": vote.to_dict()}), 200


# ══════════════════════════════════════════════
#  RECHERCHE
# ══════════════════════════════════════════════


@api.route("/search", methods=["GET"])
def search_documents():
    """Recherche de documents par mot-clé (titre, description, matière)."""
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"error": "Paramètre 'q' requis"}), 400

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    type_doc = request.args.get("type")

    query = (
        Document.query.join(Matiere)
        .filter(
            Document.statut == "approuve",
            db.or_(
                Document.titre.ilike(f"%{q}%"),
                Document.description.ilike(f"%{q}%"),
                Matiere.nom.ilike(f"%{q}%"),
            ),
        )
    )

    if type_doc:
        query = query.filter(Document.type == type_doc)

    pagination = query.order_by(Document.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify(
        {
            "documents": [d.to_dict() for d in pagination.items],
            "total": pagination.total,
            "page": pagination.page,
            "pages": pagination.pages,
        }
    ), 200


# ══════════════════════════════════════════════
#  STATISTIQUES (bonus)
# ══════════════════════════════════════════════


@api.route("/stats", methods=["GET"])
def get_stats():
    """Statistiques globales de la plateforme."""
    return jsonify(
        {
            "universites": Universite.query.count(),
            "filieres": Filiere.query.count(),
            "matieres": Matiere.query.count(),
            "documents": Document.query.filter_by(statut="approuve").count(),
            "utilisateurs": Utilisateur.query.count(),
        }
    ), 200
