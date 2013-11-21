window.webmr = {};

(function(parent) {
    var uid;
    var jobsCount = 0;
    var server = '';
    var currentJobId;

    $.ajaxSetup({
        // Disable caching of AJAX responses
        cache: false
    });

    function init() {
        $.get(server + '/init/', function(d) {
            uid = d.uid;
            ready();
        });
    }

    function ready() {
        $.get(server + '/ready/' + uid, function(d) {
            console.log(d.action);
            process(d);
        });
    }

    function process(job) {
        var jobType = job.type;
        currentJobId = job.uuid;
        console.log(jobType);

        $('.status').html('Processing data');

        var results;
        if (jobType === 'map') {
            results = window.webmr.map(job.args);
        } else {
            console.log(job.args);
            results = window.webmr.reduce(job.args.key, job.args.val);
        }

        console.log('Processed data...');
        $('.jobs-count').html(++jobsCount + ' jobs processed.');
        emit(jobType, results);
        setTimeout(ready, 2000);
        $('.status').html('Idle');
    }

    function emit(jobType, results) {
        $('.status').html('Sending results');
        var data = {
            type: jobType,
            args: results
        };
        $.post(server + '/result/' + currentJobId, data, function(data) {
            console.log('Posting results...');
        });
    }

    parent.webmr.controller = {
        init: init,
        ready: ready,
        process: process,
        emit: emit
    };

})(window);

window.webmr.controller.init();
