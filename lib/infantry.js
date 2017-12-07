var express = require('express');
var fs = require('fs');
var uuid = require('node-uuid');
var bodyParser = require('body-parser')

function init_app(env) {
    var nodes = {};

    //var environ = env;
    var environ;
    var newBatch = false;
    var batchActive = false;

    // Flag to denote if we're in reduce phase or not
    var reducePhase = false;

    var app = express();
    app.use(bodyParser.urlencoded());

    var jobQueue = [];
    var pending = {};
    loadBatch(env);

    function processResult(jobId, result) {
        if (result.type === 'map') {
            environ.store.map.writeback(result.args);
        } else {
            var key = result.args.key;
            var multipleReduces = false;

            for (var i = 0; i < jobQueue.length; i++) {
                var job = jobQueue[i];
                if (job.type === 'reduce' && job.args.key === key) {
                    jobQueue.push({
                        uuid: uuid.v1(),
                        type: 'reduce',
                        args: result});
                    multipleReduces = true;
                }
            }

            if (!multipleReduces) {
                environ.store.reduce.writeback(result.args.key, result.args.val);
            }
        }
        delete pending[jobId];
    }

    function requeuePending() {
        for (var k in pending) {
            jobQueue.push(pending[k]);
            delete pending[k];
        }
    }

    function loadBatch(env) {
        environ = env;
        var queue = environ.store.queue();
        newBatch = true;
        for (var i = 0; i < queue.length; i++) {
            jobQueue.push({uuid: uuid.v1(), type: 'map', args: {
                key: queue[i],
                val: environ.store.get(queue[i])
            }});
        }
        generateFiles();

        reducePhase = false;
        batchActive = true;
    }

    function onComplete() {
        if (environ.onComplete) {
            environ.onComplete();
        }
        batchActive = false;
    }

    function generateFiles() {
        // generate program files
        console.log('Generating program files');
        var generatedDir = __dirname + '/static/js/';

        var programCode = fs.readFileSync(environ.programSource).toString();

        var concurrentTemplate = fs.readFileSync(__dirname + '/templates/concurrent.js').toString();
        var concurrentCode = concurrentTemplate.replace("'program object replacement'", function() {
            return programCode;
        });
        fs.writeFileSync(generatedDir + 'concurrent.js', concurrentCode);

        var singleTemplate = fs.readFileSync(__dirname + '/templates/single.js').toString();
        var singleCode = singleTemplate.replace("'program object replacement'", function() {
            return programCode;
        });
        fs.writeFileSync(generatedDir + 'single.js', singleCode);
    }

    function run(port) {
        app.listen(port);
    }

    function combineReduceJobs() {
        var jobs = {};

        var pairs = environ.store.map.readPairs();
        for (var i = 0; i < pairs.length; i++) {
            var key = pairs[i].key;

            // if key already found then append the value to the list
            if (key in jobs) {
                jobs[key].push(pairs[i].val);
            } else {
                // create a new key
                jobs[key] = [pairs[i].val];
            }
        }

        // iterate through all keys and push into the job queue
        var iterKey;
        for (iterKey in jobs) {
            jobQueue.push({
                uuid: uuid.v1(),
                type: 'reduce',
                args: {
                    key: iterKey,
                    val: jobs[iterKey]
                }
            });

        }
    }

    function getNextJob() {
        if (jobQueue[0] && jobQueue[0].type === 'map') {
            //return jobQueue.shift();
        } else {
            if (!reducePhase) {
                combineReduceJobs();
                reducePhase = true;
            }
        }

        var job = jobQueue.shift();
        if (job) {
            // Its a real job!
            pending[job.uuid] = job;
        }
        return job;
    }

    app.get('/', function(req, res) {
        fs.readFile(__dirname + '/index.html', function(err, data) {
            res.set({
                'Content-Type': 'text/html'
            });
            res.send(200, data);
        });
    });

    app.post('/result/:jobId', function(req, res) {
        var jobResult = req.body;
        var jobId = req.params.jobId;

        processResult(jobId, jobResult);
        res.send(200, {status: 'OK'});
    });

    app.get('/init', function(req, res) {
        var uid = uuid.v1();
        nodes[uid] = {ready: true};
        console.log('New node : ' + uid + ' : Ready');
        res.send(200, {uid: uid});
    });

    app.get('/ready/:uid', function(req, res) {
        var uid = req.params.uid;
        var nextJob = getNextJob();

        if (nextJob) {
            nodes[uid].job = nextJob.uuid;
            res.send(200, nextJob);
        } else {
            for (var x in pending) {
                requeuePending();
                nextJob = true;
                break;
            }

            if (batchActive) {
                res.send(200, {action: 'idle'});
                if (!nextJob) {
                    onComplete();
                }
            } else {
                res.send(200, {action: 'finish'});
            }
        }
    });

    var generatedDir = __dirname + '/static/js/';
    app.get('/static/js/program.js', function(req, res) {
        var fileName;
        if (req.query.concurrent) {
            fileName = 'concurrent.js';
        } else {
            fileName = 'single.js';
        }

        fs.readFile(generatedDir + fileName, function(err, data) {
            res.set({
                'Content-Type': 'text/javascript'
            });
            res.send(200, data);
        });
    });

    app.use('/static', express.static(__dirname + '/static'));

    return {
        loadBatch: loadBatch,
        start: run
    };
}

module.exports.app = init_app;
module.exports.store = require('./store.js');
