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
        sh '''
        echo "📥 Téléchargement de kubectl..."
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
        chmod +x ./kubectl

        echo "🚀 Application des manifests K8s..."
        # On utilise ./kubectl pour utiliser la version qu'on vient de télécharger
        ./kubectl apply -f k8s/namespace.yaml
        ./kubectl apply -f k8s/postgres/secret.yaml
        ./kubectl apply -f k8s/backend/configmap.yaml
        ./kubectl apply -f k8s/postgres/
        ./kubectl apply -f k8s/backend/
        ./kubectl apply -f k8s/frontend/

        echo "🔄 Forcer le redémarrage pour utiliser les images 'latest'..."
        ./kubectl rollout restart deployment backend -n unidocs
        ./kubectl rollout restart deployment frontend -n unidocs
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