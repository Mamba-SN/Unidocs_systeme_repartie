pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        echo "📥 Récupération du code source depuis le dépôt Git..."
        checkout scm
      }
    }

    stage('Backend: Tests') {
      steps {
        sh '''
        echo "🏗️  Construction de l'image temporaire de test pour le Backend..."
        docker build -t backend-test ./backend
        
        echo "🧪  Exécution des tests unitaires avec pytest..."
        docker run --rm backend-test sh -c "pip install pytest && pytest -q"
        
        echo "✅  Tests Backend terminés avec succès!"
        '''
      }
    }

    stage('Frontend: Lint') {
      steps {
        sh '''
        echo "🏗️  Construction de l'environnement de build Frontend (arrêt à la target 'build')..."
        docker build --target build -t frontend-test ./frontend
        
        echo "🧹  Vérification de la qualité du code React (ESLint)..."
        docker run --rm frontend-test npm run lint
        
        echo "✅  Linting Frontend terminé sans erreur!"
        '''
      }
    }

    stage('Build & Push Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh '''
          echo "🔐  Authentification sur Docker Hub..."
          echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin

          SHORT_COMMIT=$(git rev-parse --short HEAD)
          echo "🏷️  Tag défini pour cette version : ${SHORT_COMMIT}"

          echo "📦  Construction de l'image de production Backend..."
          docker build -t $DOCKER_USER/unidocs-backend:$SHORT_COMMIT -f backend/Dockerfile backend
          
          echo "📦  Construction de l'image de production Frontend..."
          docker build -t $DOCKER_USER/unidocs-frontend:$SHORT_COMMIT -f frontend/Dockerfile frontend
          
          echo "☁️  Push des images avec le tag du commit ($SHORT_COMMIT)..."
          docker push $DOCKER_USER/unidocs-backend:$SHORT_COMMIT
          docker push $DOCKER_USER/unidocs-frontend:$SHORT_COMMIT
          
          echo "🏷️  Application du tag 'latest' et push additionnel..."
          docker tag $DOCKER_USER/unidocs-backend:$SHORT_COMMIT $DOCKER_USER/unidocs-backend:latest
          docker tag $DOCKER_USER/unidocs-frontend:$SHORT_COMMIT $DOCKER_USER/unidocs-frontend:latest
          docker push $DOCKER_USER/unidocs-backend:latest
          docker push $DOCKER_USER/unidocs-frontend:latest
          
          echo "✅  Images publiées avec succès sur Docker Hub!"
          '''
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig-minikube', variable: 'KUBECONFIG_FILE')]) {
          sh '''
          echo "🔑  Configuration de l'accès au cluster Minikube..."
          export KUBECONFIG=$KUBECONFIG_FILE
          
          echo "📥  Téléchargement du client kubectl..."
          curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
          chmod +x ./kubectl

          echo "🚀  Application des configurations et secrets (Namespace, ConfigMap, Secret)..."
          ./kubectl apply -f k8s/namespace.yaml
          ./kubectl apply -f k8s/postgres/secret.yaml
          ./kubectl apply -f k8s/backend/configmap.yaml
          
          echo "🚀  Déploiement des services (PostgreSQL, Backend, Frontend)..."
          ./kubectl apply -f k8s/postgres/
          ./kubectl apply -f k8s/backend/
          ./kubectl apply -f k8s/frontend/

          echo "🔄  Redémarrage des Pods pour forcer Kubernetes à télécharger les nouvelles images 'latest'..."
          ./kubectl rollout restart deployment backend -n unidocs
          ./kubectl rollout restart deployment frontend -n unidocs
          
          echo "🎉  Ordres de déploiement transmis à Kubernetes avec succès!"
          '''
        }
      }
    }
  }

  post {
    always {
      echo "🧹  Nettoyage : Déconnexion de Docker Hub..."
      sh 'docker logout || true'
    }
    success {
      echo "🌟 PIPELINE TERMINÉ AVEC SUCCÈS ! Ton application UniDocs est à jour sur le cluster."
    }
    failure {
      echo "❌ LE PIPELINE A ÉCHOUÉ. Remonte dans les logs ci-dessus pour identifier l'étape en rouge."
    }
  }
}