# cacheman-level

Standalone caching library for Node.JS and also cache engine for [cacheman](https://github.com/cayasso/cacheman) using LevelDB specifically [level](https://www.npmjs.com/package/level).

[![NPM](https://nodei.co/npm/cacheman-level.png)](https://nodei.co/npm/cacheman-level/)
[![Build Status](https://travis-ci.org/fengkx/cacheman-level.svg?branch=master)](https://travis-ci.org/fengkx/cacheman-level)
[![Coverage Status](https://coveralls.io/repos/github/fengkx/cacheman-level/badge.svg?branch=master)](https://coveralls.io/github/fengkx/cacheman-level?branch=master)

## Instalation

```bash
$ npm install cacheman-level
```

## Usage

```javascript
const CachemanLevel = require('cacheman-level');
const cache = new CachemanLevel('./DS_Store'); //location

// set the value
cache.set('my key', { foo: 'bar' }, function(error) {
    if (error) throw error;

    // get the value
    cache.get('my key', function(error, value) {
        if (error) throw error;

        console.log(value); //-> {foo:"bar"}

        // delete entry
        cache.del('my key', function(error) {
            if (error) throw error;

            console.log('value deleted');
        });
    });
});
```

## API

### CachemanLevel(location, [options, error-handler])

Create `cacheman-redis` instance. `options` are redis valid options including `port` and `host`.

```javascript
const options = {
    prefix: 'cache',
    checkFrequency: 15 * 1000
};

const cache = new CachemanLevel(location, options);
```

more options get be found [here](https://www.npmjs.com/package/leveldown#ctor)

### cache.set(key, value, [ttl, [fn]])

Stores or updates a value.

```javascript
cache.set('foo', { a: 'bar' }, function(err, value) {
    if (err) throw err;
    console.log(value); //-> {a:'bar'}
});
```

Or add a TTL(Time To Live) in seconds like this:

```javascript
// key will expire in 60 seconds
cache.set('foo', { a: 'bar' }, 60, function(err, value) {
    if (err) throw err;
    console.log(value); //-> {a:'bar'}
});
```

### cache.get(key, fn)

Retrieves a value for a given key, if there is no value for the given key a null value will be returned.

```javascript
cache.get(function(err, value) {
    if (err) throw err;
    console.log(value);
});
```

### cache.del(key, [fn])

Deletes a key out of the cache.

```javascript
cache.del('foo', function(err) {
    if (err) throw err;
    // foo was deleted
});
```

### cache.clear([fn])

Clear the cache entirely, throwing away all values.

```javascript
cache.clear(function(err) {
    if (err) throw err;
    // cache is now clear
});
```

## Run tests

```bash
$ npm test
```
