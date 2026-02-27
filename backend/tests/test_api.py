"""Tests unitaires pour l'API REST — UniDocs."""
import sys
import os
import io
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import create_app
from models import db, Universite, Filiere, Matiere


@pytest.fixture
def client():
    """Créer un client de test avec une base SQLite en mémoire."""
    app = create_app(
        {
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "TESTING": True,
            "UPLOAD_FOLDER": "/tmp/test_uploads",
        }
    )
    with app.app_context():
        _seed_test_data()
        yield app.test_client()


def _seed_test_data():
    """Insérer les données minimales pour les tests."""
    uni = Universite(nom="Université Test", sigle="UT", ville="Dakar")
    db.session.add(uni)
    db.session.flush()

    fil = Filiere(nom="Informatique", universite_id=uni.id)
    db.session.add(fil)
    db.session.flush()

    mat = Matiere(nom="Algorithmique", filiere_id=fil.id, niveau="L1")
    db.session.add(mat)
    db.session.commit()


def _register(client, **kwargs):
    defaults = {
        "nom": "Diop",
        "prenom": "Awa",
        "email": "awa@test.com",
        "mot_de_passe": "test1234",
    }
    defaults.update(kwargs)
    return client.post("/api/auth/register", json=defaults)


def _login(client, email="awa@test.com", mot_de_passe="test1234"):
    return client.post(
        "/api/auth/login", json={"email": email, "mot_de_passe": mot_de_passe}
    )


def _auth_header(client):
    _register(client)
    resp = _login(client)
    token = resp.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


# ──────────────────────────────────────────────
#  SANTÉ
# ──────────────────────────────────────────────


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "ok"


# ──────────────────────────────────────────────
#  AUTH
# ──────────────────────────────────────────────


def test_register(client):
    resp = _register(client)
    assert resp.status_code == 201
    data = resp.get_json()
    assert "token" in data
    assert data["utilisateur"]["prenom"] == "Awa"


def test_register_duplicate(client):
    _register(client)
    resp = _register(client)
    assert resp.status_code == 409


def test_login_success(client):
    _register(client)
    resp = _login(client)
    assert resp.status_code == 200
    assert "token" in resp.get_json()


def test_login_wrong_password(client):
    _register(client)
    resp = _login(client, mot_de_passe="wrong")
    assert resp.status_code == 401


def test_me(client):
    headers = _auth_header(client)
    resp = client.get("/api/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.get_json()["email"] == "awa@test.com"


def test_me_no_token(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


# ──────────────────────────────────────────────
#  UNIVERSITÉS
# ──────────────────────────────────────────────


def test_get_universites(client):
    resp = client.get("/api/universites")
    assert resp.status_code == 200
    assert len(resp.get_json()) >= 1


def test_get_universite_detail(client):
    resp = client.get("/api/universites/1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "filieres" in data


# ──────────────────────────────────────────────
#  FILIÈRES / MATIÈRES
# ──────────────────────────────────────────────


def test_get_filieres(client):
    resp = client.get("/api/filieres")
    assert resp.status_code == 200


def test_get_matieres(client):
    resp = client.get("/api/matieres?niveau=L1")
    assert resp.status_code == 200
    assert len(resp.get_json()) >= 1


# ──────────────────────────────────────────────
#  DOCUMENTS (upload)
# ──────────────────────────────────────────────


def test_upload_document(client):
    headers = _auth_header(client)
    data = {
        "titre": "Cours Algo L1",
        "matiere_id": "1",
        "type": "cours",
        "description": "Premier chapitre",
        "fichier": (io.BytesIO(b"dummy pdf content"), "algo.pdf"),
    }
    resp = client.post(
        "/api/documents",
        data=data,
        headers=headers,
        content_type="multipart/form-data",
    )
    assert resp.status_code == 201
    assert resp.get_json()["titre"] == "Cours Algo L1"


def test_upload_no_auth(client):
    data = {
        "titre": "Cours",
        "matiere_id": "1",
        "type": "cours",
        "fichier": (io.BytesIO(b"data"), "cours.pdf"),
    }
    resp = client.post(
        "/api/documents", data=data, content_type="multipart/form-data"
    )
    assert resp.status_code == 401


def test_get_documents(client):
    resp = client.get("/api/documents")
    assert resp.status_code == 200
    assert "documents" in resp.get_json()


# ──────────────────────────────────────────────
#  RECHERCHE
# ──────────────────────────────────────────────


def test_search_no_query(client):
    resp = client.get("/api/search")
    assert resp.status_code == 400


def test_search(client):
    resp = client.get("/api/search?q=algo")
    assert resp.status_code == 200
    assert "documents" in resp.get_json()


# ──────────────────────────────────────────────
#  STATS
# ──────────────────────────────────────────────


def test_stats(client):
    resp = client.get("/api/stats")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "universites" in data
    assert "documents" in data
