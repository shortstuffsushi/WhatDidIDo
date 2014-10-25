var Promise = require('bluebird'),
    Path = require('path'),
    childProcess = Promise.promisifyAll(require('child_process')),
    fs = Promise.promisifyAll(require('fs')),
    emailRegex = /\(<(.*?)>/,
    ignoreRegex = /\.DS_Store|\.git|node_modules|\.sass-cache|3rd[Pp]arty/,
    noSuchPathRegex = /no such path '.*' in .*/,
    REPO_CLONE_DIR = Path.join(__dirname, 'repos'),
    REPO_EXISTS_MSG = /Command failed: fatal: destination path .* already exists and is not an empty directory./,
    SHA_REGEX = /commit (.*)/,
    AUTHOR_REGEX = /Author: (.*)/,
    DATE_REGEX = /Date: (.*)/,
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

            var curFileBlame = { totalLines: 0, contributors: [ ], contributorsMap: { } };
            var blameByLine = blame.split('\n').filter(function(line) { return line.length; });

            blameByLine.forEach(function(line) {
                overallBlame.totalLines++;
                curFileBlame.totalLines++;

                var email = line.match(emailRegex).pop();

                if (!curFileBlame.contributorsMap[email]) {
                    var fileContributor = {
                        email: email,
                        lineCount: 0
                    };

                    curFileBlame.contributorsMap[email] = fileContributor;
                    curFileBlame.contributors.push(fileContributor);
                }

                if (!overallBlame.contributorsMap[email]) {
                    var overallContributor = {
                        email: email,
                        lineCount: 0
                    };

                    overallBlame.contributorsMap[email] = overallContributor;
                    overallBlame.contributors.push(overallContributor);
                }

                curFileBlame.contributorsMap[email].lineCount++;
                overallBlame.contributorsMap[email].lineCount++;
            });

            delete curFileBlame.contributorsMap;
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

function _runGitBlame(overallBlame, path) {
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

function _checkOutRevisionBackXCommits(numberOfCommits) {
    return childProcess.execAsync('git checkout master~' + numberOfCommits)
        .then(function() {
            return childProcess.execAsync('git log HEAD~1..HEAD');
        })
        .then(function(logOutput) {
            // TODO figure out why this is an array...
            logOutput = logOutput.shift();

            var values = logOutput.split('\n');
            var sha = SHA_REGEX.exec(values[0])[1];
            var author = AUTHOR_REGEX.exec(values[1])[1];
            var date = DATE_REGEX.exec(values[2])[1];

            return {
                sha: sha,
                author: author,
                date: date
            };
        });
}

function _moveIntoDirectoryAndRun(dir, numberOfCommits, blames) {
    var decrementedNumberOfCommits = numberOfCommits - 1;

    _verboseLog('Looking at ' + dir + ' back ' + decrementedNumberOfCommits + ' commits');

    // Save this off so we can come back
    var startDir = process.cwd();

    // Then move to the project dir. We have to be here to run the git commands.
    process.chdir(dir);

    var versionBlame = { totalLines: 0, files: { }, contributors: [ ], contributorsMap: { } };
    return _checkOutRevisionBackXCommits(decrementedNumberOfCommits)
        .then(function(commitInfo) {
            versionBlame.commit = commitInfo;

            return _runGitBlame(versionBlame, dir);
        })
        .then(function() {
            delete versionBlame.contributorsMap;

            blames = blames || [];

            blames.push(versionBlame);

            if (decrementedNumberOfCommits > 0) {
                return _moveIntoDirectoryAndRun(dir, decrementedNumberOfCommits, blames);
            }
            else {
                return blames;
            }
        })
        .finally(function() {
            // Make sure to come back to the start
            process.chdir(startDir);
        });
}

function _shallowCloneRemote(host, repo) {
    _verboseLog('Attempting to clone' + repo);

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
                _verboseLog(repo + 'already exists');
            }
            else {
                throw e;
            }
        });
}

// Public API
function _execute(opts) {
    verbose = opts.verbose;
    ignores = opts.customIgnores;

    if (opts.type === 'remote') {
        return _shallowCloneRemote(opts.host, opts.repo)
            .then(function() {
                var repoPath = Path.join(REPO_CLONE_DIR, opts.repo);

                return _moveIntoDirectoryAndRun(repoPath, opts.numberOfCommits);
            });
    }
    else {
        return _moveIntoDirectoryAndRun(opts.projectDir, opts.numberOfCommits);
    }
}

module.exports = {
    execute: _execute
};
