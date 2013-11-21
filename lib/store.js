var fs = require('fs');

var fsStore = function(path) {
    var mapData = [];
    var reduceData = {};
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
        },
        'writeback':  function(data) {
            fs.appendFile(path + '/output/out.txt', data);
        },
        map: {
            writeback: function(keyVal) {
                for (var key in keyVal) {
                    mapData.push({
                        key: key,
                        val: keyVal[key]
                    });
                }
            },
            readPairs: function() {
                return mapData;
            }
        },
        reduce: {
            writeback: function(key, val) {
                reduceData[key] = val;
                console.log(key + ' ' + val);
            }
        }
    };
};

module.exports.fs = fsStore;
