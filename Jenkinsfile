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
        // On construit une image temporaire pour les tests au lieu de monter un volume
        sh '''
        docker build -t backend-test ./backend
        docker run --rm backend-test sh -c "pip install pytest && pytest -q"
        '''
      }
    }

    stage('Frontend: Lint') {
      steps {
        sh '''
        # On s'arrête à l'étape "build" du Dockerfile qui contient Node.js
        docker build --target build -t frontend-test ./frontend
        # On lance le lint directement dans cette image
        docker run --rm frontend-test npm run lint
        '''
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