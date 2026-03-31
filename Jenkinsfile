pipeline {
    agent any

    environment {
        DEPLOY_DIR = '/var/www/html/course-registration'
        NODE_OPTIONS = '--max-old-space-size=256'
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Pulling latest code...'
                checkout scm
            }
        }

        stage('Verify Environment') {
            steps {
                echo 'Checking Node and npm versions...'
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing npm packages (optimized)...'
                sh '''
                    rm -rf node_modules package-lock.json
                    npm ci --prefer-offline --no-audit --no-fund
                '''
            }
        }

        stage('Build') {
            steps {
                echo 'Building React app (low memory)...'
                sh 'npm run build'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying to Nginx directory...'
                sh '''
                    mkdir -p $DEPLOY_DIR
                    rm -rf $DEPLOY_DIR/*
                    cp -r dist/* $DEPLOY_DIR/
                    echo "Deployed at $(date)" > $DEPLOY_DIR/deploy.log
                '''
            }
        }

        stage('Set Permissions') {
            steps {
                echo 'Setting correct permissions...'
                sh '''
                    sudo chown -R www-data:www-data $DEPLOY_DIR
                    sudo chmod -R 755 $DEPLOY_DIR
                '''
            }
        }

        stage('Reload Nginx') {
            steps {
                echo 'Reloading Nginx...'
                sh 'sudo systemctl reload nginx'
            }
        }
    }

    post {
        success {
            echo '✅ App deployed successfully!'
            echo '🌐 Access your app at: http://20.204.247.210'
        }
        failure {
            echo '❌ Build failed! Check console output.'
        }
        always {
            cleanWs()
        }
    }
}