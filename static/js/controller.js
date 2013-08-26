window.webmr = {};

(function(parent) {
    var uid;
    var jobsCount = 0;
    var server = 'http://localhost:8000';

    function init() {
        $.get(server + '/init/', function(d) {
            uid = d.uid;
            ready();
        });
    }

    function ready() {
        $.get(server + '/ready/' + uid, function(d) {
            console.log(d.action);
            if (d.action === 'map') {
                var index = d.index;
                process(d.data);
            } else {
                setTimeout(ready, 2000);
                $('.status').html('Idle');
            }
        });
    }

    function process(data) {
        $('.status').html('Processing data');
        var results = window.webmr.map(data);
        console.log(results);
        $('.jobs-count').html(++jobsCount + ' jobs processed.');
        emit(results);
        setTimeout(ready, 2000);
        $('.status').html('Idle');
    }

    function emit(results) {
        $('.status').html('Sending results');
        var data = {
            'map_results': results
        };
        $.post(server + '/reduce/' + uid, data, function(data) {
            console.log(data);
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
