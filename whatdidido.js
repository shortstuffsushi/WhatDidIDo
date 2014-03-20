var Promise = require('bluebird'),
    childProcess = Promise.promisifyAll(require('child_process')),
    fs = Promise.promisifyAll(require('fs')),
    emailRegex = /\(<(.*?)>/,
    ignoreRegex = /\.DS_Store|\.git|node_modules|\.sass-cache|3rd[Pp]arty/,
    noSuchPathRegex = /no such path '.*' in .*/,
    overallBlame = { totalLines: 0, files: { }, contributors: { } }, verbose, ignores;

function _verboseLog(msg) {
    verbose && console.log(msg);
}

function _runGitBlame(path) {
    // There are a lot of files we don't care to check, ignore them...
    if (ignoreRegex.test(path) || (ignores && ignores.test(path))) { return; }

    _verboseLog(path);

    return fs.statAsync(path)
        .then(function(stat) {
            if (stat.isDirectory()) {
                return fs.readdirAsync(path)
                    .then(function(dirItems) {
                        var dirPromises = [];
                        dirItems.forEach(function(dirItem) {
                            dirPromises.push(_runGitBlame(path + '/' + dirItem));
                        });

                        return Promise.all(dirPromises);
                    });
            }
            else {
                return childProcess.execAsync('git blame --show-email ' + path)
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
        })
        .catch(function(e) {
            // TODO better logging
            _verboseLog(path + ' failed, skipping.\n' + e);
        })
}

function _execute(opts) {
    verbose = opts.verbose;
    ignores = opts.customIgnores;

    // Save this off so we can come back
    var startDir = process.cwd();

    // Then move to the project dir. We have to be here to run the git commands.
    process.chdir(opts.projectDir);

    return _runGitBlame(opts.projectDir)
        .catch(function(err) {
            debugger;
            console.log(err);
        })
        .finally(function() {
            process.chdir(startDir);
        })
        .then(function() {
            return overallBlame;
        });
}

module.exports = {
    execute: _execute
};
