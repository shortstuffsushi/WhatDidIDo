var express = require('express'),
    whatdidido = require('./whatdidido'),
    app = express();

app.get('/:repositoryName', function(req, res) {
    var repositoryName = req.params.repositoryName,
        actualRepo = process.cwd() + '/../' + repositoryName,
        opts = {
            verbose: false,
            projectDir: actualRepo,
            customIgnores: new RegExp('android|Pods|test/lib|www/lib')
        };

    whatdidido.execute(opts)
        .then(function(results) {
            res.send(JSON.stringify(results));
        })
        .catch(function(e) {
            res.send(JSON.stringify(e));
        });
});

app.listen(3000);
