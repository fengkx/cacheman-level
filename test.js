const test = require('ava');
const Cache = require('./src');
let cache;

test.before('createCache', (t) => {
    cache = new Cache('./.DS_Store');
    t.context = 'created';
    t.pass();
});

test.after('closeCache', (t) => {
    cache.clear(function(err) {
        if (!err) {
            cache.close(function(err) {
                if (!err) t.pass();
            });
        }
    });
});

test('have main method', (t) => {
    t.plan(4);
    t.truthy(cache.set);
    t.truthy(cache.del);
    t.truthy(cache.get);
    t.truthy(cache.clear);
});

test.cb('set value', (t) => {
    cache.set('abc', 'ABC', t.end);
});

test.cb('get value', (t) => {
    cache.get('abc', function(e, v) {
        if (!e) {
            t.is(v, 'ABC');
            t.end();
        }
    });
});

test.cb('cleanup', (t) => {
    cache.set('a', 'A', function(err) {
        if (err) throw err;
        cache.set('b', 'B', function(err) {
            if (err) throw err;
            cache.clear(function(err) {
                if (err) throw err;
                cache.get('a', function(err, val) {
                    if (err) throw err;
                    t.is(val, null);
                    cache.get('b', function(err, val) {
                        if (err) throw err;
                        t.is(val, null);
                        t.end();
                    });
                });
            });
        });
    });
});

test.cb('set zero', (t) => {
    cache.set('zero', 0, function(err) {
        if (err) throw err;
        cache.get('zero', function(err, val) {
            if (err) throw err;
            t.is(val, 0);
            t.end();
        });
    });
});

test.cb('set false', (t) => {
    cache.set('false', false, function(err) {
        if (err) throw err;
        cache.get('false', function(err, val) {
            if (err) throw err;
            t.is(val, false);
            t.end();
        });
    });
});

test.cb('set object', (t) => {
    const o = { a: 'a',
        b: 'b',
        n: null,
        num: 3 };
    cache.set('object', o, function(err) {
        if (err) throw err;
        cache.get('object', function(err, val) {
            if (err) throw err;
            t.deepEqual(val, o);
            t.end();
        });
    });
});

test.cb('get many times', (t) => {
    t.plan(3);
    cache.set('times', 'asd123', function(err) {
        if (err) throw err;
        cache.get('times', function(err, data) {
            if (err) throw err;
            t.is(data, 'asd123');
            cache.get('times', function(err, data) {
                if (err) throw err;
                t.is(data, 'asd123');
                cache.get('times', function(err, data) {
                    if (err) throw err;
                    t.is(data, 'asd123');
                    t.end();
                });
            });
        });
    });
});

test.serial.cb('set ttl', (t) => {
    const ttl = 2000;
    cache.set('ttl', ttl, ttl, function(err) {
        if (err) throw err;
        cache.get('ttl', function(err, val) {
            if (err) throw err;
            t.is(val, ttl);
            // CheckFrequency default 15s
            setTimeout(() => {
                cache.get('ttl', function(err, val) {
                    if (err) throw err;
                    t.is(val, null);
                    t.end();
                });
            }, 20000);
        });
    });
});

test.serial.cb('set ttl as -1', (t) => {
    cache.set('-1', 123, -1, function(err) {
        if (err) throw err;
        cache.get('-1', function(err, val) {
            if (err) throw err;
            t.is(val, 123);
            setTimeout(() => {
                cache.get('-1', function(err, v) {
                    if (err) throw err;
                    t.is(v, 123);
                    t.end();
                });
            }, 2000);
        });
    });
});

test.cb('error no string key', (t) => {
    const error = t.throws(() => {
        cache.set(123, { a: 'A' });
    });
    t.is(error.message, 'key store in LevelDB must be string');
    t.end();
});

test.cb('delete item', (t) => {
    const o = { num: 123,
        obj: { a: 'A',
            b: 'B' } };
    cache.set('item', o, function(err) {
        if (err) throw err;
        cache.get('item', function(err, val) {
            if (err) throw err;
            t.deepEqual(val, o);
            cache.del('item', function(err) {
                if (err) throw err;
                cache.get('item', function(err, val) {
                    if (err) throw err;
                    t.deepEqual(val, null);
                    t.end();
                });
            });
        });
    });
});

test.cb('error get empty key', (t) => {
    cache.get('not found', function(err, val) {
        if (err) throw err;
        t.is(val, null);
        t.end();
    });
});
