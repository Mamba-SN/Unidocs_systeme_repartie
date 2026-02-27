📚 UniDocs - Bibliothèque Numérique pour Étudiants
UniDocs est un système réparti conçu pour permettre aux étudiants de partager et de consulter des ressources académiques (cours, TD, anciens sujets) de manière organisée par université, filière et niveau.

Ce projet a été réalisé dans le cadre du module Systèmes Répartis (Master 1).

🛠 Technologies utilisées
Backend & Data
Framework : Python Flask

Base de données : PostgreSQL

ORM : Flask-SQLAlchemy

Tests : Pytest (17 tests automatisés)

Frontend
Framework : React + Vite (Node.js 20+)

Styling : Tailwind CSS

Qualité : ESLint

DevOps & Orchestration
Conteneurisation : Docker & Docker Compose

CI/CD : Jenkins (Pipeline scripté)

Orchestration : Kubernetes (Minikube)

Configuration : Ansible

🚀 Architecture CI/CD
Le projet intègre un pipeline de déploiement continu automatisé via Jenkins. Chaque modification poussée sur la branche main déclenche les étapes suivantes :

Checkout : Récupération du code source depuis GitHub.

Backend Tests : Construction d'une image de test et exécution de 17 tests unitaires avec pytest.

Frontend Lint : Vérification de la qualité du code React avec eslint.

Build & Push : Construction des images Docker de production et envoi vers Docker Hub (mambasn/unidocs-*).

Deploy : Déploiement automatique des nouveaux conteneurs sur le cluster Kubernetes (K8s).

📦 Installation et Lancement (Local)
Prérequis
Docker & Docker Compose

Minikube (pour le déploiement K8s)

Ansible (pour la configuration initiale)

Lancement avec Docker Compose
Bash
docker-compose up --build
L'application sera accessible sur :

Frontend : http://localhost:5173

API Backend : http://localhost:5000

☸️ Déploiement Kubernetes
Les manifests se trouvent dans le dossier /k8s. Pour déployer manuellement :

Bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/

👤 Auteur

Nickname : Serigne Mbacke Ndiaye
Formation : Master 1 Systèmes d'Information
