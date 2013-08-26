window.webmr.map = function(names) {
    console.log(names);
    results = {};
    names.forEach(function(name) {
        console.log(name);
        var firstLetter = name[0];
        if (firstLetter in results) {
            results[firstLetter]++;
        } else {
            results[firstLetter] = 1;
        }
    });
    return results;
};
