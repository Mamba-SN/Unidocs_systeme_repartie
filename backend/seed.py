"""Script de seed — données initiales pour les universités sénégalaises."""
from app import create_app
from models import db, Universite, Filiere, Matiere, Utilisateur

app = create_app()

with app.app_context():
    # ── Nettoyage ──────────────────────────────
    Vote = db.Model.registry._class_registry.get("Vote")
    for tbl in ("vote", "document", "matiere", "filiere", "universite", "utilisateur"):
        db.session.execute(db.text(f"DELETE FROM {tbl}"))
    db.session.commit()

    # ══════════════════════════════════════════
    #  UNIVERSITÉS
    # ══════════════════════════════════════════
    universites = {
        "UCAD": Universite(
            nom="Université Cheikh Anta Diop de Dakar", sigle="UCAD", ville="Dakar"
        ),
        "UGB": Universite(
            nom="Université Gaston Berger de Saint-Louis", sigle="UGB", ville="Saint-Louis"
        ),
        "UADB": Universite(
            nom="Université Alioune Diop de Bambey", sigle="UADB", ville="Bambey"
        ),
        "UASZ": Universite(
            nom="Université Assane Seck de Ziguinchor", sigle="UASZ", ville="Ziguinchor"
        ),
        "UT": Universite(
            nom="Université de Thiès", sigle="UT", ville="Thiès"
        ),
    }
    db.session.add_all(universites.values())
    db.session.flush()

    # ══════════════════════════════════════════
    #  FILIÈRES (par université)
    # ══════════════════════════════════════════
    filieres_data = {
        "UCAD": [
            "Informatique", "Mathématiques", "Physique", "Droit",
            "Économie et Gestion", "Lettres Modernes", "Médecine",
        ],
        "UGB": [
            "Informatique", "Mathématiques Appliquées", "Économie",
            "Droit", "Lettres", "Sciences de l'Éducation",
        ],
        "UADB": [
            "Informatique", "Mathématiques", "Économie et Gestion",
            "Lettres", "Sciences de la Vie",
        ],
        "UASZ": [
            "Informatique", "Agroforesterie", "Économie",
            "Droit", "Lettres",
        ],
        "UT": [
            "Génie Civil", "Génie Informatique", "Économie Rurale",
            "Sciences Agronomiques",
        ],
    }

    filieres = {}
    for sigle, noms in filieres_data.items():
        for nom in noms:
            f = Filiere(nom=nom, universite_id=universites[sigle].id)
            db.session.add(f)
            filieres[f"{sigle}_{nom}"] = f
    db.session.flush()

    # ══════════════════════════════════════════
    #  MATIÈRES (exemples pour Informatique UCAD)
    # ══════════════════════════════════════════
    info_ucad = filieres["UCAD_Informatique"]
    matieres_info = [
        # L1
        ("Algorithmique", "L1"),
        ("Introduction à l'Informatique", "L1"),
        ("Mathématiques pour l'Informatique", "L1"),
        ("Architecture des Ordinateurs", "L1"),
        # L2
        ("Programmation Orientée Objet", "L2"),
        ("Bases de Données", "L2"),
        ("Systèmes d'Exploitation", "L2"),
        ("Réseaux Informatiques", "L2"),
        # L3
        ("Génie Logiciel", "L3"),
        ("Intelligence Artificielle", "L3"),
        ("Sécurité Informatique", "L3"),
        ("Projet de Fin de Licence", "L3"),
        # M1
        ("Systèmes Répartis", "M1"),
        ("Machine Learning", "M1"),
        ("Cloud Computing", "M1"),
        ("Recherche Opérationnelle", "M1"),
        # M2
        ("Big Data", "M2"),
        ("DevOps", "M2"),
        ("Mémoire de Master", "M2"),
    ]

    for nom, niveau in matieres_info:
        db.session.add(Matiere(nom=nom, filiere_id=info_ucad.id, niveau=niveau))

    # Quelques matières pour Informatique UGB aussi
    info_ugb = filieres["UGB_Informatique"]
    for nom, niveau in [
        ("Algorithmique et Structures de Données", "L1"),
        ("Programmation C", "L1"),
        ("Bases de Données Avancées", "L2"),
        ("Réseaux et Protocoles", "L2"),
        ("Compilation", "L3"),
        ("Systèmes Distribués", "M1"),
    ]:
        db.session.add(Matiere(nom=nom, filiere_id=info_ugb.id, niveau=niveau))

    db.session.flush()

    # ══════════════════════════════════════════
    #  UTILISATEUR ADMIN
    # ══════════════════════════════════════════
    admin = Utilisateur(
        nom="Admin",
        prenom="Plateforme",
        email="admin@unidocs.sn",
        role="admin",
    )
    admin.set_password("admin123")
    db.session.add(admin)

    # Utilisateur étudiant de test
    etudiant = Utilisateur(
        nom="Ndiaye",
        prenom="Moussa",
        email="moussa@ucad.sn",
        role="etudiant",
        universite_id=universites["UCAD"].id,
        filiere_id=info_ucad.id,
        niveau="M1",
    )
    etudiant.set_password("etudiant123")
    db.session.add(etudiant)

    db.session.commit()

    # ── Résumé ─────────────────────────────
    print("✅ Seed terminé avec succès !")
    print(f"   → {len(universites)} universités")
    print(f"   → {len(filieres)} filières")
    print(f"   → {Matiere.query.count()} matières")
    print(f"   → 2 utilisateurs (admin + étudiant)")
    print()
    print("   Comptes de test :")
    print("   • admin@unidocs.sn / admin123")
    print("   • moussa@ucad.sn  / etudiant123")
