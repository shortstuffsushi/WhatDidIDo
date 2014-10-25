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

    // Check type
    if (req.params.type) {
        opts.type = req.params.type;
    }

    var opts = {
        type: 'remote',
        host: 'github',
        verbose: false,
        repo: repo,
        projectDir: actualRepo,
        customIgnores: new RegExp('android|Pods|test/lib|www/lib')
    };

    whatdidido
        .execute(opts)
        .then(function(results) {
            console.log('got results:', results);
            res.json(results);
        })
        .catch(function(e) {
            res.status(500).json(e);
        });
});

app.listen(3000);
