pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        // Récupération du code depuis ton dépôt local [cite: 49]
        checkout scm
      }
    }

    stage('Backend: Tests') {
      steps {
        // Utilisation de $(pwd) pour garantir le chemin absolu sur l'hôte [cite: 42]
        sh 'docker run --rm -v $(pwd)/backend:/src -w /src python:3.12-slim sh -c "pip install --no-cache-dir -r requirements.txt && pytest -q"'
      }
    }

    stage('Frontend: Lint') {
      steps {
        // Vérification de la qualité du code React [cite: 42]
        sh 'docker run --rm -v $(pwd)/frontend:/src -w /src node:18-alpine sh -c "npm ci && npm run lint"'
      }
    }

    stage('Build & Push Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
          sh '''
          SHORT_COMMIT=$(git rev-parse --short HEAD)
          # Construction des images avec le tag du commit [cite: 44]
          docker build -t $DOCKER_USER/unidocs-backend:$SHORT_COMMIT -f backend/Dockerfile backend
          docker build -t $DOCKER_USER/unidocs-frontend:$SHORT_COMMIT -f frontend/Dockerfile frontend
          
          # Push vers Docker Hub [cite: 46]
          docker push $DOCKER_USER/unidocs-backend:$SHORT_COMMIT
          docker push $DOCKER_USER/unidocs-frontend:$SHORT_COMMIT
          
          # Tag additionnel 'latest' pour faciliter le déploiement
          docker tag $DOCKER_USER/unidocs-backend:$SHORT_COMMIT $DOCKER_USER/unidocs-backend:latest
          docker tag $DOCKER_USER/unidocs-frontend:$SHORT_COMMIT $DOCKER_USER/unidocs-frontend:latest
          docker push $DOCKER_USER/unidocs-backend:latest
          docker push $DOCKER_USER/unidocs-frontend:latest
          '''
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        // Déploiement automatique sur le cluster local [cite: 33, 47]
        // On monte le dossier k8s et la config kube du conteneur Jenkins
        sh '''
        kubectl apply -f k8s/namespace.yaml
        kubectl apply -f k8s/postgres/
        kubectl apply -f k8s/backend/
        kubectl apply -f k8s/frontend/
        '''
      }
    }
  }

  post {
    always {
      sh 'docker logout || true'
    }
  }
}