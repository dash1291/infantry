var express = require('express');
var fs = require('fs');

var reduce_func = require('./reduce.js').reduce_func;
var store = require('./store.js').store;

var app = express();
var nodes = {};

app.use(express.bodyParser());

var queue = store.queue();

app.get('/', function(req, res) {
    fs.readFile('index.html', function(err, data) {
        res.set({
            'Content-Type': 'text/html'
        });
        res.send(200, data);
    });
});

app.post('/reduce/:uid', function(req, res) {
    var uid = req.params.uid;
    var data = req.body.map_results;
    reduce_func(data);
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

app.use('/static', express.static(__dirname + '/static'));
app.listen(8000);
