const test = require('ava');
const mm = require('mm');
const del = require('del');
const Cache = require('./src');
let cache;

test.before('createCache', (t) => {
    cache = new Cache('./.DS_Store_test');
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

test.cb('set value without callback', (t) => {
    t.notThrows(() => {
        cache.set('no cb', 'noThrow', 3);
    });
    t.end()
});

test.cb('del value without callback', (t) => {
    t.notThrows(() => {
        cache.del('no cb');
    });
    t.end();
});

test.cb('clear without callback', (t) => {
    t.notThrows(() => {
        cache.clear();
    });
    t.end();
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
    const ttl = 2;
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
    // T.plan(3)
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
            }, 3000);
        });
    });
});

test.cb('error no string key', (t) => {
    const error = t.throws(() => {
        cache.set(123, { a: 'A' });
    });
    t.is(error.message, 'key store in LevelDB must be string');
    const error2 = t.throws(() => {
        cache.get(123);
    });
    t.is(error2.message, 'key store in LevelDB must be string');
    const error3 = t.throws(() => {
        cache.del(123, { a: 'A' });
    });
    t.is(error3.message, 'key store in LevelDB must be string');
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

test.cb('mock close err', (t) => {
    mm.errorOnce(cache.db, 'close', 'mock close error');
    cache.close(function (err) {
        t.is(err.message, 'mock close error');
        mm.restore();
        t.end();
    })
});

test.cb('mock put err', (t) => {
    mm.errorOnce(cache.db, 'put', 'mock put error');
    cache.set('mock put err', { a: 'A' }, 10, function (err) {
        t.is(err.message, 'mock put error');
        mm.restore();
        t.end()
    })
});

test.cb('mock del err', (t) => {
    mm.errorOnce(cache.db,'del', 'mock del error');
    cache.del('a', function (err) {
        t.is(err.message, 'mock del error');
        mm.restore();
        t.end();
    })
});


test('can pass option to level', (t) => {
    const c = new Cache('./.DS_Store_test1', {
        cacheSize: 10 * 1024 * 1024,
        checkFrequency: 15 * 1000,
        prefix: 'cache'
    });
    t.truthy(c);
    t.is(c.prefix, 'cache');
    t.is(c.db.options.cacheSize, 10 * 1024 * 1024);
    c.close();
});

test('need to pass location', (t) => {
    const err = t.throws(() => {
        const c = new Cache();
    });
    t.is(err.message, 'You should proide a location to store data');
});

test.cb('error cause', (t) => {
    const c = new Cache('./.DS_Store_test2', function(err) {
        c.set('closed', { a: '1' }, function(err) {
            c.close(function(err) {
                c.set('closed', { a: '1' }, function(err) {
                    if (!err) t.fail();
                });
                c.set('closed', { b: '2' }, -1, function(err) {
                    if (!err) t.fail();
                });
                c.get('closed', function(err, val) {
                    if (!err) t.fail();
                    t.end();
                });
            });
        });
    });
});

test.cb('error JSON stringify typeerror', (t) => {
    const o = {};
    o.o=o;
    cache.set('cyclic object', o, function (err) {
        t.true(err instanceof TypeError);
        t.end()
    });
});


test.after('clean DS_Store_test dir', async (t) => {
    await del(['.DS_Store_test*'])
})
