var fs = require('fs');

var store = {
        'get': function(index) {
            return fs.readFileSync('./data/' + index + '.txt', {encoding: 'utf-8'}).split('\n');
        },
        'queue': function() {
            var list = fs.readdirSync('./data/');
            var i = 0;
            var queue = [];
            list.forEach(function(name) {
                if (name.substr(-4) === '.txt') {
                    queue.push(String(i));
                    i++;
                }
            });
            return queue;
        }
    };

module.exports.store = store;
