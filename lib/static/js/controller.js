window.infantry = {};

(function(parent) {
    var uid;
    var jobsCount = 0;
    var server = '';
    var currentJobId;
    var concurrency = 0;
    var workers = [];
    var busyWorkers = [];
    var workerResults = [];

    $.ajaxSetup({
        // Disable caching of AJAX responses
        cache: false
    });

    function init() {

        // Initialize workers if concurrent level specified.
        if (concurrency) {
            for(var i = 0; i < concurrency; i++) {
                var worker = new Worker('/static/js/program.js?concurrent=1');
                workers.push(worker);

                worker.onerror = function(e) {
                    alert('errr');
                };

                worker.onmessage = function(e) {
                    var data = e.data;
                    switch (data.cmd) {
                        case 'results':
                            handleWorkerResults(data.worker, data.results);
                            break;

                        case 'debug':
                            //console.log(data.msg);
                            break;
                    }
                };
                //console.log(worker);
                worker.postMessage({cmd: 'init', workerIndex: workers.length - 1});

            }
        }

        $.get(server + '/init/', function(d) {
            uid = d.uid;
            ready();
        });
    }

    function handleWorkerResults(worker, results) {
        //console.log(results);
        busyWorkers.splice(busyWorkers.indexOf(worker), 1);
        workerResults = workerResults.concat(results);

        if (!busyWorkers.length) {
            emit('map', workerResults);
            workerResults = [];
        }
    }

    function ready() {
        $.get(server + '/ready/' + uid, function(d) {
            //console.log(d.action);
            if (d.type) {
                process(d);
            }
        });
    }

    function process(job) {
        var jobType = job.type;
        currentJobId = job.uuid;
        //console.log(jobType);

        $('.status').html('Processing data');

        var results;
        if (jobType === 'map') {
            if (concurrency) {
                //console.log('dispatching to workers');
                var chunks = infantry.program.splitJob(job.args, concurrency);
                for (var i = 0; i < concurrency; i++) {
                    workers[i].postMessage({cmd: 'job', type: 'map', data: chunks[i]});
                    busyWorkers.push(i);
                }
                return;
            } else {
                results = infantry.program.map(job.args);
                emit('map', results);

            }
        } else {
            //console.log(job.args);
            results = infantry.program.reduce(job.args.key, job.args.val);
            emit('reduce', results);
        }
    }

    function emit(jobType, results) {
        $('.jobs-count').html(++jobsCount + ' jobs processed.');

        $('.status').html('Sending results');
        var data = {
            type: jobType,
            args: results
        };
        $.post(server + '/result/' + currentJobId, data, function(data) {
            //console.log('Posting results...');
        });

        setTimeout(ready, 100);
        $('.status').html('Idle');
    }

    parent.infantry.controller = {
        init: init,
        ready: ready,
        process: process,
        emit: emit
    };

})(window);

window.infantry.controller.init();
