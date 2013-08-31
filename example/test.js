var infantry = require('infantry');

var store = infantry.store.fs(__dirname + '/data');

var env = {
	store: store,
	mapJS: __dirname + '/map.js',
	reduce_func: require('./reduce.js').reduce_func
};

infantry.server(env);
