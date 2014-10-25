var path = require('path'),
    express = require('express'),
    expressConfigurator = require('express-configurator'),
    whatdidido = require('../whatdidido'),
    app = express();

expressConfigurator.init(app, [
    { name: 'morgan', config: 'dev' },
    { name: 'body-parser', config: { submodules: [ 'json', { name: 'urlencoded', config: { extended: true } } ] } },
    { name: 'serve-static', config: path.join(__dirname, '..', 'web'), context: '/web' }
]);

app.get('/:repoOwner/:repo', function(req, res) {
    var repoOwner = req.params.repoOwner;
    var repo = req.params.repoOwner + (req.params.repo ? '/' + req.params.repo : '');
    var actualRepo = path.join(__dirname, '..', '..', repo);
    var type = req.query.type || 'remote';
    var numberOfCommits = req.query.numberOfCommits || 5;
    var host = req.query.host || 'github';
    var customIgnores = req.params.customIgnores || '^$';

    var opts = {
        type: type,
        host: host,
        verbose: false,
        numberOfCommits: numberOfCommits,
        repo: repo,
        projectDir: actualRepo,
        customIgnores: new RegExp(customIgnores)
    };

    whatdidido
        .execute(opts)
        .then(function(results) {
            res.json(results);
        })
        .catch(function(e) {
            res.status(500).json(e);
        });
});

app.listen(3000);
