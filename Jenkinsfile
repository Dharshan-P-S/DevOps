pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'    // must match name in Jenkins → Tools config
    }

    environment {
        APP_NAME   = 'course-registration'
        DEPLOY_DIR = '/var/www/html/course-registration'
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📥 Pulling latest code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installing npm packages...'
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                echo '🔨 Building React app...'
                sh 'npm run build'
            }
            post {
                success {
                    echo '✅ Build succeeded!'
                }
                failure {
                    echo '❌ Build failed!'
                }
            }
        }

        stage('Deploy') {
            steps {
                echo '🚀 Deploying to web server...'
                sh '''
                    mkdir -p $DEPLOY_DIR
                    rm -rf $DEPLOY_DIR/*
                    cp -r dist/* $DEPLOY_DIR/
                    echo "Deployed at $(date)" > $DEPLOY_DIR/deploy.log
                '''
            }
        }
    }

    post {
        success {
            echo '🎉 Pipeline complete! App is live.'
        }
        failure {
            echo '💥 Pipeline failed. Check console output.'
        }
        always {
            cleanWs()    // clean workspace after every build
        }
    }
}