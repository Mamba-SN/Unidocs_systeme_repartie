"""Modèles SQLAlchemy — domaine : partage de documents universitaires."""
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


# ──────────────────────────────────────────────
#  UNIVERSITÉ
# ──────────────────────────────────────────────
class Universite(db.Model):
    __tablename__ = "universite"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nom = db.Column(db.String(250), nullable=False)
    sigle = db.Column(db.String(20), nullable=False, unique=True)
    ville = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    filieres = db.relationship("Filiere", backref="universite", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "sigle": self.sigle,
            "ville": self.ville,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Universite {self.sigle}>"


# ──────────────────────────────────────────────
#  FILIÈRE
# ──────────────────────────────────────────────
class Filiere(db.Model):
    __tablename__ = "filiere"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nom = db.Column(db.String(200), nullable=False)
    universite_id = db.Column(
        db.Integer, db.ForeignKey("universite.id"), nullable=False
    )
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    matieres = db.relationship("Matiere", backref="filiere", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "universite_id": self.universite_id,
            "universite": self.universite.sigle if self.universite else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Filiere {self.nom}>"


# ──────────────────────────────────────────────
#  MATIÈRE
# ──────────────────────────────────────────────
class Matiere(db.Model):
    __tablename__ = "matiere"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nom = db.Column(db.String(200), nullable=False)
    filiere_id = db.Column(db.Integer, db.ForeignKey("filiere.id"), nullable=False)
    niveau = db.Column(db.String(10), nullable=False)  # L1, L2, L3, M1, M2
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    documents = db.relationship("Document", backref="matiere", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "filiere_id": self.filiere_id,
            "filiere": self.filiere.nom if self.filiere else None,
            "niveau": self.niveau,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Matiere {self.nom}>"


# ──────────────────────────────────────────────
#  UTILISATEUR
# ──────────────────────────────────────────────
class Utilisateur(db.Model):
    __tablename__ = "utilisateur"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    mot_de_passe = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="etudiant")  # etudiant, delegue, admin
    universite_id = db.Column(
        db.Integer, db.ForeignKey("universite.id"), nullable=True
    )
    filiere_id = db.Column(db.Integer, db.ForeignKey("filiere.id"), nullable=True)
    niveau = db.Column(db.String(10), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    documents = db.relationship("Document", backref="auteur", lazy=True)
    votes = db.relationship("Vote", backref="utilisateur", lazy=True)

    # — helpers auth —
    def set_password(self, password):
        self.mot_de_passe = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.mot_de_passe, password)

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "prenom": self.prenom,
            "email": self.email,
            "role": self.role,
            "universite_id": self.universite_id,
            "filiere_id": self.filiere_id,
            "niveau": self.niveau,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Utilisateur {self.prenom} {self.nom}>"


# ──────────────────────────────────────────────
#  DOCUMENT
# ──────────────────────────────────────────────
class Document(db.Model):
    __tablename__ = "document"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    titre = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, default="")
    type = db.Column(db.String(20), nullable=False)  # cours, examen, td, tp, expose
    fichier_nom = db.Column(db.String(300), nullable=False)  # nom original
    fichier_stockage = db.Column(db.String(300), nullable=False)  # nom sur disque
    taille = db.Column(db.Integer, default=0)
    format = db.Column(db.String(10), default="pdf")
    annee_academique = db.Column(db.String(20), nullable=True)
    matiere_id = db.Column(db.Integer, db.ForeignKey("matiere.id"), nullable=False)
    auteur_id = db.Column(
        db.Integer, db.ForeignKey("utilisateur.id"), nullable=False
    )
    nb_telechargements = db.Column(db.Integer, default=0)
    statut = db.Column(db.String(20), default="en_attente")  # en_attente, approuve, rejete
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    votes = db.relationship("Vote", backref="document", lazy=True, cascade="all, delete-orphan")

    @property
    def note_moyenne(self):
        if not self.votes:
            return 0
        return round(sum(v.note for v in self.votes) / len(self.votes), 1)

    def to_dict(self):
        return {
            "id": self.id,
            "titre": self.titre,
            "description": self.description,
            "type": self.type,
            "fichier_nom": self.fichier_nom,
            "taille": self.taille,
            "format": self.format,
            "annee_academique": self.annee_academique,
            "matiere_id": self.matiere_id,
            "matiere": self.matiere.nom if self.matiere else None,
            "auteur_id": self.auteur_id,
            "auteur": (
                f"{self.auteur.prenom} {self.auteur.nom}" if self.auteur else None
            ),
            "nb_telechargements": self.nb_telechargements,
            "note_moyenne": self.note_moyenne,
            "statut": self.statut,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Document {self.titre}>"


# ──────────────────────────────────────────────
#  VOTE (notation des documents)
# ──────────────────────────────────────────────
class Vote(db.Model):
    __tablename__ = "vote"
    __table_args__ = (
        db.UniqueConstraint("document_id", "utilisateur_id", name="uq_vote"),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    document_id = db.Column(
        db.Integer, db.ForeignKey("document.id"), nullable=False
    )
    utilisateur_id = db.Column(
        db.Integer, db.ForeignKey("utilisateur.id"), nullable=False
    )
    note = db.Column(db.Integer, nullable=False)  # 1 – 5
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "document_id": self.document_id,
            "utilisateur_id": self.utilisateur_id,
            "note": self.note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
