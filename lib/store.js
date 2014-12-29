var fs = require('fs');

var fsStore = function(path, type) {
    var mapData = [];
    var reduceData = {};

    return {
        'get': function(index) {
            return fs.readFileSync(path.resolve(path, 'input', index), {encoding: 'utf-8'});
        },
        'queue': function() {
            var list = fs.readdirSync(path.resolve(path, 'input'));
            var i = 0;
            var queue = [];
            list.forEach(function(name) {
                if (name.substr(type.length * -1) === type) {
                    queue.push(name);
                    i++;
                }
            });
            return queue;
        },
        'writeback':  function(data) {
            fs.appendFile(path.resolve(path, 'output', 'out.txt'), JSON.stringify(reduceData));
        },
        map: {
            writeback: function(keyVals) {
                mapData = mapData.concat(keyVals);
            },
            readPairs: function() {
                return mapData;
            }
        },
        reduce: {
            writeback: function(key, val) {
                reduceData[key] = val;
                console.log(key + ' ' + JSON.stringify(val));
            },
            readPairs: function() {
                return reduceData;
            }
        }
    };
};

module.exports.fs = fsStore;
