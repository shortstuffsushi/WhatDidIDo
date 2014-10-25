var Promise = require('bluebird'),
    Path = require('path'),
    childProcess = Promise.promisifyAll(require('child_process')),
    fs = Promise.promisifyAll(require('fs')),
    emailRegex = /\(<(.*?)>/,
    ignoreRegex = /\.DS_Store|\.git|node_modules|\.sass-cache|3rd[Pp]arty/,
    noSuchPathRegex = /no such path '.*' in .*/,
    REPO_CLONE_DIR = Path.join(__dirname, 'repos'),
    REPO_EXISTS_MSG = /Command failed: fatal: destination path .* already exists and is not an empty directory./,
    verbose = true,
    ignores;

function _verboseLog(msg) {
    verbose && console.log(msg);
}

function _blameFile(overallBlame, path) {
    return childProcess.execAsync('git blame --show-email -- ' + path)
        .then(function(blame) {
            if (!blame) { return; }

            // TODO figure out why this is an array...
            blame = blame.shift();

            var curFileBlame = { totalLines: 0 };
            var blameByLine = blame.split('\n').filter(function(line) { return line.length; });

            blameByLine.forEach(function(line) {
                overallBlame.totalLines++;
                curFileBlame.totalLines++;

                var email = line.match(emailRegex).pop();

                if (!curFileBlame[email]) {
                    curFileBlame[email] = 0;
                }

                if (!overallBlame.contributors[email]) {
                    overallBlame.contributors[email] = 0;
                }

                curFileBlame[email]++;
                overallBlame.contributors[email]++;
            });

            overallBlame.files[path] = curFileBlame;
        })
        .catch(function(e) {
            // No such path means this file isn't committed, which is fine, just skip it.
            // Anything else... we've got a problem.
            if (!noSuchPathRegex.test(e.message)) {
                throw e;
            }
        });
}

function _blameDir(overallBlame, path) {
    return fs.readdirAsync(path)
        .then(function(dirItems) {
            var dirPromises = [];
            dirItems.forEach(function(dirItem) {
                dirPromises.push(_runGitBlame(overallBlame, path + '/' + dirItem));
            });

            return Promise.all(dirPromises);
        })
}

function _runGitBlame(overallBlame, path, dir) {
    // There are a lot of files we don't care to check, ignore them...
    if (ignoreRegex.test(path) || (ignores && ignores.test(path))) { return; }

    _verboseLog(path);

    return fs.statAsync(path)
        .then(function(stat) {
            return (stat.isDirectory() ? _blameDir : _blameFile)(overallBlame, path);
        })
        .catch(function(e) {
            // TODO better logging
            _verboseLog(path + ' failed, skipping.\n' + e);
        })
}

function _moveIntoDirectoryAndRun(dir) {
    // Save this off so we can come back
    var startDir = process.cwd();

    // Then move to the project dir. We have to be here to run the git commands.
    process.chdir(dir);

    var overallBlame = { totalLines: 0, files: { }, contributors: { } };

    console.log('Starting blame of', dir);
    return _runGitBlame(overallBlame, dir)
        .catch(function(err) {
            console.log(err);
        })
        .finally(function() {
            process.chdir(startDir);
        })
        .then(function() {
            console.log('completed')
            return overallBlame;
        });
}

function _shallowCloneRemote(host, repo) {
    console.log('Attempting to clone', repo);

    // Host aliasing
    if (host === 'github') {
        host = 'https://github.com/';
    }
    else if (host === 'bitbucket') {
        host = 'https://bitbucket.org/';
    }

    // TODO not clone everything
    return childProcess.execAsync('git clone ' + host + repo + ' ' + Path.join(REPO_CLONE_DIR, repo))
        .catch(function(e) {
            // Already cloned this dood
            if (REPO_EXISTS_MSG.test(e.message)) {
                console.log(repo, 'already exists');
            }
            else {
                throw e;
            }
        });
}

// Public API
function _execute(opts) {
    // verbose = opts.verbose;
    ignores = opts.customIgnores;

    if (opts.type === 'remote') {
        return _shallowCloneRemote(opts.host, opts.repo)
            .then(function() {
                var repoPath = Path.join(REPO_CLONE_DIR, opts.repo);

                return _moveIntoDirectoryAndRun(repoPath);
            });
    }
    else {
        return _moveIntoDirectoryAndRun(opts.projectDir);
    }
}

module.exports = {
    execute: _execute
};
