var express = require('express');
var fs = require('fs');

function init_app(env) {
    var nodes = {};
    var store = env.store;
    var queue = store.queue();

    var app = express();
    app.use(express.bodyParser());

    app.get('/', function(req, res) {
        fs.readFile(__dirname + '/index.html', function(err, data) {
            res.set({
                'Content-Type': 'text/html'
            });
            res.send(200, data);
        });
    });

    app.post('/reduce/:uid', function(req, res) {
        var uid = req.params.uid;
        var data = req.body.map_results;
        env.reduce_func(data);
        var index = nodes[uid]['index'];
        queue.shift(queue.indexOf(index));
        res.send(200, {status: 'OK'});
    });

    app.get('/init', function(req, res) {
        var uid = new Date().getTime();
        nodes[uid] = {ready: true};
        console.log('New node : ' + uid + ' : Ready');
        res.send(200, {uid: uid});
    });

    app.get('/ready/:uid', function(req, res) {
        var uid = req.params.uid;
        if (!queue.length) {
            res.send(200, {action: 'idle'});
        } else {
            var index = queue[0];
            nodes[uid]['index'] = index;
            res.send(200, {action: 'map', data: store.get(index)});
        }
    });

    app.get('/static/js/map.js', function(req, res) {
        fs.readFile(env.mapJS, function(err, data) {
            res.set({
                'Content-Type': 'application/js'
            });
            res.send(200, data);
        });
    });

    app.use('/static', express.static(__dirname + '/static'));

    app.listen(8000);
}

module.exports.server = init_app;
module.exports.store = require('./store.js');
