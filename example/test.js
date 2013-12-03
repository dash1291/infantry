var infantry = require('infantry');

var store = infantry.store.fs(__dirname + '/data');

var env = {
	store: store,
	programSource: __dirname + '/map.js',
	port: 8888
};

infantry.server(env);
