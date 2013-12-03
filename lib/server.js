var express = require('express');
var fs = require('fs');
var uuid = require('node-uuid');


function init_app(env) {
    var nodes = {};

    // Flag to denote if we're in reduce phase or not
    var reducePhase = false;

    var app = express();
    app.use(express.bodyParser());

    var jobQueue = [];
    var queue = env.store.queue();
    for (var i = 0; i < queue.length; i++) {
        jobQueue.push({uuid: uuid.v1(), type: 'map', args: env.store.get(queue[i])});
    }

    function processResult(result) {
        if (result.type === 'map') {
            env.store.map.writeback(result.args);
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
                env.store.reduce.writeback(result.args.key, result.args.val);
            }
        }
    }

    function combineReduceJobs() {
        var jobs = {};

        var pairs = env.store.map.readPairs();
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
            return jobQueue.shift();
        } else {
            if (!reducePhase) {
                combineReduceJobs();
                reducePhase = true;
            }
            return jobQueue.shift();
        }
    }

    function getReduceBatch(key) {
        var batch = [];
        for (var j = 0; j < jobQueue.length; j++) {
            if (jobQueue[j].type === 'reduce' && jobQueue[j].args.key === key) {
                batch.push({
                    uuid: uuid.v1(),
                    type: 'reduce',
                    args: {
                        key: pairs[i].key,
                        val: pairs[i].val
                    }
                });
                jobQueue.splice(j, 1);
            }
        }

        return batch;
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
        var jobType = req.params.jobType;
        var jobId = req.params.jobId;
        var jobResult = req.body;

        processResult(jobResult);

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

        if (!nextJob) {
            res.send(200, {action: 'idle'});
        } else {
            nodes[uid]['job'] = nextJob.uuid;
            res.send(200, nextJob);
        }
    });

    // generate program files
    console.log('Generating program files');
    var generatedDir = __dirname + '/static/js/';

    var programCode = fs.readFileSync(env.programSource).toString();

    var concurrentTemplate = fs.readFileSync(__dirname + '/templates/concurrent.js').toString();
    var concurrentCode = concurrentTemplate.replace('program object replacement', function(match, offset, string) {
        return programCode;
    });
    fs.writeFileSync(generatedDir + 'concurrent.js', concurrentCode);

    var singleTemplate = fs.readFileSync(__dirname + '/templates/single.js').toString();
    var singleCode = singleTemplate.replace("'program object replacement'", function() {
        return programCode;
    });
    fs.writeFileSync(generatedDir + 'single.js', singleCode);

    app.get('/static/js/program.js', function(req, res) {
        if (req.query.concurrent) {
            var fileName = 'concurrent.js';
        } else {
            var fileName = 'single.js';
        }

        fs.readFile(generatedDir + fileName, function(err, data) {
            res.set({
                'Content-Type': 'application/js'
            });
            res.send(200, data);
        });
    });

    app.use('/static', express.static(__dirname + '/static'));

    console.log('Starting server');
    app.listen(env.port);
}

module.exports.server = init_app;
module.exports.store = require('./store.js');
