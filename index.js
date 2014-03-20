var whatdidido = require('./whatdidido');

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
    var args = process.argv.slice(2),
        options = {
            verbose: false,
            projectDir: null,
            customIgnores: null
        };

    // Drop node and script name
    var helpIndex = args.indexOf('-h');
    if (helpIndex != -1) {
        _printUsage();
        process.exit(0);
    }

    var verboseIndex = args.indexOf('-v');
    if (verboseIndex != -1) {
        options.verbose = true;
        args.splice(verboseIndex, 1);
    }

    var ignoreIndex = args.indexOf('-i');
    if (ignoreIndex != -1) {
        options.customIgnores = new RegExp(args[ignoreIndex + 1]);
        args.splice(ignoreIndex, 2);
    }

    var percentIndex = args.indexOf('-p');
    if (percentIndex != -1) {
        options.printPercentages = true;
        args.splice(percentIndex, 1);
    }

    options.projectDir = args.length ? args.pop() : process.cwd();

    // Fix trailing slash.
    if (/\/$/.test(options.projectDir)) {
        options.projectDir = options.projectDir.slice(0, -1);
    }

    return options;
}

function _printResults(printPercentages, overallBlame) {
    debugger;
    if (!printPercentages) {
        console.log(overallBlame);
    }
    else {
        var coveragePercents = [], padString = '      ';

        for (var email in overallBlame.contributors) {
            var contributorLines = overallBlame.contributors[email];

            var coveragePercent = contributorLines / overallBlame.totalLines * 100;

            coveragePercents.push({ percent: coveragePercent, email: email });
        }

        coveragePercents.sort(function(a, b) {
            return a.percent < b.percent;
        });

        coveragePercents.forEach(function(coverage) {
            var fixedPercent = (padString + coverage.percent.toFixed(2)).slice(-padString.length);
            console.log(fixedPercent + ' | ' + coverage.email);
        });
    }
}

var opts = _parseArgs();

whatdidido.execute(opts)
    .then(function(results) {
        _printResults(opts.printPercentages, results);
    });
