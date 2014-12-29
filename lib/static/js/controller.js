window.infantry = {};

(function(parent) {
    'use strict';

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

    function init(serverAddr) {
        server = serverAddr || '';
        loadScripts(function() {
            $.get(server + '/init/', function(d) {
                uid = d.uid;
                ready();
            });
        });
    }

    function handleWorkerResults(worker, results) {
        busyWorkers.splice(busyWorkers.indexOf(worker), 1);
        workerResults = workerResults.concat(results);

        if (!busyWorkers.length) {
            emit('map', workerResults);
            workerResults = [];
        }
    }

    function ready() {
        $.get(server + '/ready/' + uid, function(d) {
            if (d.type) {
                process(d);
            } else if (d === 'new batch') {
                // reset everything
                loadScripts(function() {
                    setTimeout(ready, 100);
                });
            } else if (d.action === 'finish') {
                // Do nothing. We're done.
                $('.status').text('Finished!');
            }
            else {
                setTimeout(ready, 1000);
            }

        });
    }

    function process(job) {
        var jobType = job.type;
        currentJobId = job.uuid;

        $('.status').html('Processing data');

        var results;
        if (jobType === 'map') {
            if (concurrency) {
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

    function setConcurrency(workers) {
        if (concurrency) {
            concurrency = workers;
        }
    }

    function loadScripts(callback) {
        $.getScript('/static/js/program.js', function(data, textStatus, jqxhr) {
            if (callback) {
                callback();
            }
        });

        // Reload workers if already spawned.
        if (workers.length) {
            reloadWorkerScripts();
            return;
        }


        function handleWorkerMessage(e) {
            var data = e.data;
            switch (data.cmd) {
                case 'results':
                    handleWorkerResults(data.worker, data.results);
                    break;

                case 'debug':
                    console.log(data.msg);
                    break;
            }
        }

        function handleWorkerError(e) {
            console.log('Worker error');
        }

        // Initialize workers if concurrent level specified.
        if (concurrency) {
            for(var i = 0; i < concurrency; i++) {
                var worker = new Worker('/static/js/program.js?concurrent=1');
                workers.push(worker);
                worker.onerror = handleWorkerError;
                worker.onmessage = handleWorkerMessage;
                worker.postMessage({cmd: 'init', workerIndex: workers.length - 1});
            }
        }
    }

    function reloadWorkerScripts() {
        for(var i = 0; i < workers.length; i++) {
            workers[i].postMessage({cmd: 'load', src: '/static/js/program.js?concurrent=1'});
        }
    }

    parent.infantry.controller = {
        init: init,
        ready: ready,
        process: process,
        emit: emit,
        setConcurrency: setConcurrency
    };

})(window);
