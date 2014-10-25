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

app.get('/:repositoryName', function(req, res) {
    var repositoryName = req.params.repositoryName,
        actualRepo = process.cwd() + '/../' + repositoryName,
        opts = {
            verbose: false,
            projectDir: actualRepo,
            customIgnores: new RegExp('android|Pods|test/lib|www/lib')
        };

    whatdidido
        .execute(opts)
        .then(function(results) {
            res.json(results);
        })
        .catch(function(e) {
            res.json(400, e);
        });
});

app.listen(3000);
