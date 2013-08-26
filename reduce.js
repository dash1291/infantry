var writeBack = {};

var reduce_func = function(map_results) {
    var sum = 0;
    var key;
    for (key in map_results) {
        if (key in writeBack) {
            writeBack[key] += Number(map_results[key]);
        } else {
            writeBack[key] = Number(map_results[key]);
        }
    }
    console.log(writeBack['S']);
};

module.exports.reduce_func = reduce_func;
