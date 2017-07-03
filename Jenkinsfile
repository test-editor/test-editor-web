#!groovy
nodeWithProperWorkspace {

    stage('Checkout') {
        checkout scm
        if (isMaster()) {
            // git by default checks out detached, we need a local branch
            sh "git checkout $env.BRANCH_NAME" // workaround for https://issues.jenkins-ci.org/browse/JENKINS-31924
            sh 'git fetch --prune origin +refs/tags/*:refs/tags/*' // delete all local tags
            sh "git reset --hard origin/master"
            sh "git clean -ffdx"
        } else {
            sh "git clean -ffd"
        }
    }

    stage('Build') {
        withGradleEnv {
            gradle 'clean build'
        }
    }

    // need to get tests running first!
    // stage('Test') {
    //     withGradleEnv {
    //         gradle 'test'
    //     }
    // }

    // no release stage, will be added if deemed necessary
}
