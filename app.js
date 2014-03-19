var exec = require('exec-sync'),
    Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    emailRegex = /\(<(.*?)>/,
    ignoreRegex = /\.DS_Store|\.git|node_modules|\.sass-cache|3rd[Pp]arty/,
    noSuchPathRegex = /no such path '.*' in .*/,
    overallBlame = { totalLines: 0, files: { }, contributors: { } },
    projectDir, customIgnores, verbose = false, printPercentages = false;

function _verboseLog(msg) {
    verbose && console.log(msg);
}

function _printUsage() {
    console.log('Usage: ' + process.argv[0] + ' ' + process.argv[1] + ' [options] [project_directory]\n\n' +
                'If no project_directory is specified, current working directory is used.\n\n' +
                'Options:\n' +
                '  -h       Print this usage\n' +
                '  -v       Print verbose messages\n' +
                '  -i regex Pattern for files to ignore\n' +
                '  -p       Print overall contributors\'s percentages\n\n');
}

function _parseArgs() {
    var args = process.argv.slice(2); // Drop node and script name

    var helpIndex = args.indexOf('-h');
    if (helpIndex != -1) {
        _printUsage();
        process.exit(0);
    }

    var verboseIndex = args.indexOf('-v');
    if (verboseIndex != -1) {
        verbose = true;
        args.splice(verboseIndex, 1);
    }

    var ignoreIndex = args.indexOf('-i');
    if (ignoreIndex != -1) {
        customIgnores = new RegExp(args[ignoreIndex + 1]);
        args.splice(ignoreIndex, 2);
    }

    var percentIndex = args.indexOf('-p');
    if (percentIndex != -1) {
        printPercentages = true;
        args.splice(percentIndex, 1);
    }

    projectDir = args.length ? args.pop() : process.cwd();
}

function _runGitBlame(path) {
    // There are a lot of files we don't care to check, ignore them...
    if (ignoreRegex.test(path) || (customIgnores && customIgnores.test(path))) { return Promise.resolve(); }

    _verboseLog(path);

    var stat;

    try {
        stat = fs.statSync(path);
    }
    catch (e) {
        _verboseLog(path + ' failed, skipping.');
        return Promise.resolve();
    }

    if (stat.isDirectory(path)) {
        return fs
            .readdirAsync(path)
            .then(function(dirItems) {
                var dirPromises = [];
                dirItems.forEach(function(dirItem) {
                    dirPromises.push(_runGitBlame(path + '/' + dirItem));
                });

                return Promise.all(dirPromises);
            });
    }
    else {
        return new Promise(function(resolve, reject) {
            try {
                var blame = exec('git blame --show-email ' + path);

                if (!blame) {
                    resolve(); // got no one to blame
                }

                var curFileBlame = { totalLines: 0 };
                var blameByLine = blame.split('\n');

                blameByLine.forEach(function(line) {
                    overallBlame.totalLines++;
                    curFileBlame.totalLines++;

                    var email = line.match(emailRegex)[1];

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

                resolve();
            }
            catch (e) {
                // No such path means this file isn't committed, which is fine, just skip it.
                // Anything else... we've got a problem.
                if (noSuchPathRegex.test(e.message)) {
                    resolve();
                }
                else {
                    reject(e);
                }
            }
        });
    }
}

function _printResults() {
    if (!printPercentages) {
        console.log(overallBlame);
    }
    else {
        var coveragePercents = [], padString = '      ';

        for (var email in overallBlame.contributors) {
            var contributorLines = overallBlame.contributors[email];

            var coveragePercent = contributorLines / overallBlame.totalLines * 100;
            var coveragePercentFixed = (padString + coveragePercent.toFixed(2)).slice(-padString.length);

            console.log(coveragePercentFixed + ' | ' + email);
        }
    }
}

_parseArgs();

// Save this off so we can come back
var startDir = process.cwd();

// Then move to the project dir. We have to be here to run the git commands.
process.chdir(projectDir);

_runGitBlame(projectDir)
    .then(_printResults)
    .catch(function(err) {
        console.log(err);
    })
    .finally(function() {
        process.chdir(startDir);
    });
