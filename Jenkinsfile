pipeline {
    agent any

    environment {
        DEPLOY_DIR = '/var/www/html/course-registration'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Pulling latest code...'
                checkout scm
            }
        }

        stage('Install Node') {
            steps {
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing packages...'
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                echo 'Building React app...'
                sh 'npm run build'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying to Nginx...'
                sh '''
                    rm -rf $DEPLOY_DIR/*
                    cp -r dist/* $DEPLOY_DIR/
                    echo "Deployed at $(date)" > $DEPLOY_DIR/deploy.log
                '''
            }
        }
    }

    post {
        success { echo 'App is live at http://20.204.247.210:8080 }
        failure { echo 'Build failed! Check console output.' }
        always  { cleanWs() }
    }
}