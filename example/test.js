var infantry = require('infantry');

var store = infantry.store.fs(__dirname + '/data', '.txt');

var inf = infantry.app({
    store: store,
    programSource: __dirname + '/map.js'
});

inf.start(8080);
