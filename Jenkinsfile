pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Backend: Tests') {
      steps {
        sh '''
        docker run --rm -v $PWD/backend:/src -w /src python:3.12-slim sh -c "pip install --no-cache-dir -r requirements.txt && pytest -q"
        '''
      }
    }

    stage('Frontend: Lint') {
      steps {
        sh '''
        docker run --rm -v $PWD/frontend:/src -w /src node:18-alpine sh -c "npm ci && npm run lint"
        '''
      }
    }

    stage('Build & Push Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
          sh '''
          SHORT_COMMIT=$(git rev-parse --short HEAD)
          docker build -t $DOCKER_USER/unidocs-backend:$SHORT_COMMIT -f backend/Dockerfile backend
          docker build -t $DOCKER_USER/unidocs-frontend:$SHORT_COMMIT -f frontend/Dockerfile frontend
          docker push $DOCKER_USER/unidocs-backend:$SHORT_COMMIT
          docker push $DOCKER_USER/unidocs-frontend:$SHORT_COMMIT
          '''
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        sh '''
        # Utilise une image contenant kubectl pour appliquer les manifests
        docker run --rm -v $HOME/.kube:/root/.kube -v $PWD/k8s:/k8s bitnami/kubectl:latest kubectl -n unidocs apply -f /k8s
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
