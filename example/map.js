(function () {
    function map(names) {
        var keys = {};
        var results = [];

        names.forEach(function(name) {
            var firstLetter = name[0];
            if (firstLetter in keys) {
                results[keys[firstLetter]].val++;
            } else {
                results.push({
                    key: firstLetter,
                    val: 1
                });
                keys[firstLetter] = results.length - 1;
            }
        });
        return results;
    }

    function reduce(key, results) {
        var sum = 0;
        for (var i = 0; i < results.length; i++) {
            sum += Number(results[i]);
        }
        return {key: key, val: sum};
    }

    function splitJob(names, divs) {
        var splitLen = Math.ceil(names.length / divs);
        var splits = [];
        for (var i = 0; i < divs; i++) {
            splits.push(names.slice(splitLen * i, splitLen * (i + 1)));
        }
        //console.log(splits);
        return splits;
    }

    return {
        map: map,
        reduce: reduce,
        splitJob: splitJob
    };
})();
