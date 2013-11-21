function JobQueue() {
    var queue = {map: [], reduce: []};
    var onChangeCallback = callback;
    var reducing = false;

    return {
        push: function(type, jobs) {
            var i;
            for (i in jobs) {
                queue.push({type: type, args: jobs[i].args});
            }
        },

        pop: function(type) {
            return queue[type].shift();
        },

        queue: queue
    };
}

module.exports.JobQueue = JobQueue;
