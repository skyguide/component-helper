var Promise = require('es6-promise').Promise;
var log = require('./utils/log');
var fs = require('./utils/fs');
var helper = require('./utils/config-helper');
var component, paths, pkg;

function getConfig(){
    component = helper.getConfig();
    component.release = (typeof component.release == 'string') ?
        ['git', 'gh-pages', component.release] :
        component.release;
}

function ghPagesRelease(message){
    getConfig();
    if (!component.release || component.release.indexOf('gh-pages') <0){
        log.info('Skipping gh-pages Release');
        return Promise.resolve();
    }
    var ghPages = require('gh-pages');
    message = message || 'Update';
    log.info("\nReleasing to gh-pages\n");
    return new Promise(function(resolve, reject){
        ghPages.publish(component.paths.site.root, {message: message }, function(err) {
            ghPages.clean();
            err && reject(err);
            !err && resolve();
        });
    });
}

function s3(version){
    getConfig();
    if (!component.release || component.release.indexOf('s3') <0){
        log.info('Skipping S3 Release');
        return Promise.resolve();
    }
    log.info("\nReleasing s3\n");
    var Release = require('./wrappers/s3');
    var options = component.s3 || {};
    var target = options.target || '';
    if (version){
        target = target.replace(/("|\/)[0-9]+\.[0-9]+\.[0-9]\-?(?:(?:[0-9A-Za-z-]+\.?)+)?("|\/)/g, '$1' + version + '$2');
    }
    return new Release(component.paths.site.root + '/**/*.*', target, options).write();
}

function releaseGit(version){
    getConfig();
    if (!component.release || component.release.indexOf('git') <0){
        log.info('Skipping Git Release');
        return Promise.resolve();
    }
    var git = require('./utils/git');
    if (!git.checkRemote()){
        return log.onError(['No valid Remote Git URL.',
            'Please update your `.git/config` file or run:',
            '$ component init git'].join('\n'));
    }
    version = version || component.pkg.version;
    log.info('Releasing to Git');
    return git.release(version);
}

function run(type){
    var bump = require('./bump').run;
    var bumpedVersion;
    return bump(type).then(function(version) {
        bumpedVersion = version;
        return releaseGit(version);
    }).then(function(){
        return ghPagesRelease('v' + bumpedVersion);
    }).then(function(){
        return s3(bumpedVersion);
    }).catch(log.onError);
}

module.exports = {
    git: releaseGit,
    'gh-pages': ghPagesRelease,
    s3: s3,
    run: run,
    all: run,
    adhoc: run
};
