infantry
========

Run MapReduce in client's browser.


**NOTE:** The code is more of an example right now. It calculates the total number of names in a corpus that start with each letter in the processed results.

`reduce.js`: Contains the reduce function `reduce_func`. Define your own.

`static/js/map.js`: Contains the map function `map`. Runs on the browser. Define your own.

`test_data.py`: Generates chunks of data (random list of names) as `.txt` files.
