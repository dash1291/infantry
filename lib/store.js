var fs = require('fs');

var fsStore = function(path) {
    return {
        'get': function(index) {
            return fs.readFileSync(path + '/' + index + '.txt', {encoding: 'utf-8'}).split('\n');
        },
        'queue': function() {
            var list = fs.readdirSync(path);
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
};

module.exports.fs = fsStore;
