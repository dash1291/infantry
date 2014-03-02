# Infantry

Run MapReduce in client's browser.

## Installation

Install using `npm` using the following command:

`npm install https://github.com/dash1291/infantry.git`

## Usage

An example application can be found inside `example/` directory of the source code. The example generates chunks of data constituting person names from an NLTK corpus. The map/reduce prepares a dictionary of alphabets as keys and the number of names starting with the particular alphabet as the value.

### Configuring the server

```javascript
var infantry = require('infantry');

// Specify where your data lies. See "Data Splitting" section for more details
var store = infantry.store.fs(__dirname + '/data');

// Set your configuration object
var env = {
        store: store,

        // This points to the file containing your map-reduce code. See "Program code" section for more details.
        programSource: __dirname + '/map.js',
};

// Initialize the app using `env` as configuration object.
var inf = inf.app(env);

// Start the server on port 8080
infantry.start(8080);
```

### Data Splitting

As of now, Infantry uses a very simple storage interface. Because of that, splitting of data has to be taken care of manually by the user. Simply create a directory, and split your dataset into text files with names in the pattern of `0.txt`, `1.txt`, `2.txt` and so on.

### Program code

The user has to write their map-reduce application inside a file and point the `programSource` in the configuration object. Its upto the user what goes inside this file but there are two requirements which should be met for the entire thing to work, that is, the user defined map/reduce functions. A typical file would look something like this:

```javascript
window.webmr.map = function(data) {
    // `data` can be be of any format (depending on the dataset) and its upto the user how to handle it.

    // `results` should be the result of your map computation and an array of key-value pairs (objects).
    // The notation of the object should be: {key: key, val: value}
    return results;
};

window.webmr.reduce = function(key, results) {
	// `key` is a string and `results` is an array here.

    // In the returned object `key` should refer to the same key passed to the function.
    // `result` is the result of your reduce computation.
    return {key: key, val: result};
};
```

Above is just a template of the map/reduce functions that can be written. What exactly can be written and made to work is really upto the user's understanding of MapReduce and capabilities of Infantry.

### Customizing storage

Only filesystem based storage is possible for now. Customizable backends to come.
