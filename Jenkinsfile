pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'
    }

    environment {
        DEPLOY_DIR = 'C:\\deploy\\course-registration'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Pulling latest code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing npm packages...'
                bat 'npm ci'
            }
        }

        stage('Build') {
            steps {
                echo 'Building React app...'
                bat 'npm run build'
            }
            post {
                success { echo 'Build succeeded!' }
                failure { echo 'Build failed!' }
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying...'
                bat '''
                    if not exist "%DEPLOY_DIR%" mkdir "%DEPLOY_DIR%"
                    xcopy /E /Y /I dist\\* "%DEPLOY_DIR%\\"
                '''
            }
        }
    }

    post {
        success { echo 'App deployed successfully!' }
        failure { echo 'Pipeline failed. Check console output.' }
        always  { cleanWs() }
    }
}