const level = require('level');
const ttl = require('level-ttl');
const noop = () => {};

class LevelDBCache {
    constructor(location, options, cb) {
        let db, checkFrequency, prefix;
        if (!location) throw new Error('You should proide a location to store data');
        if (options) {
            db = level(location, options);
            checkFrequency = options.checkFrequency;
        } else {
            db = level(location);
        }
        if (cb) db = level(location, options, cb);
        this.prefix = prefix || '';
        this.db = ttl(db, {
            checkFrequency: checkFrequency || 15 * 1000,
            ttl: Infinity
        });
    }

    set(key, value, ttl, fn = noop) {
        if (typeof ttl === 'function') {
            fn = ttl;
            ttl = null;
        }
        if (typeof key !== 'string') throw new Error('key store in LevelDB must be string');
        const k = `${this.prefix}${key}`;
        try {
            value = JSON.stringify(value);
        } catch (e) {
            fn(e);
        }
        if (ttl === -1) {
            this.db.put(k, value, function(err) {
                if (err) {
                    return fn(err);
                }
                fn(null, null);
            });
        } else {
            this.db.put(k, value, { ttl }, function(err) {
                if (err) {
                    return fn(err);
                }
                fn(null, null);
            });
        }
    }

    get(key, fn = noop) {
        if (typeof key !== 'string') throw new Error('key store in LevelDB must be string');
        this.db.get(key, function(err, value) {
            if (err) {
                if (err.notFound) {
                    fn(null, null);
                } else {
                    fn(err);
                }
            } else {
                fn(null, JSON.parse(value));
            }
        });
    }

    del(key, fn = noop) {
        if (typeof key !== 'string') throw new Error('key store in LevelDB must be string');
        this.db.del(key, function(err) {
            fn(err);
        });
    }

    clear(fn = noop) {
        this.db
            .createKeyStream()
            .on('data', (key) => {
                this.db.del(key, function(err) {
                    if (err) return fn(err);
                });
            })
            .on('end', function() {
                fn(null, null);
            });
    }
    close(fn = noop) {
        this.db.close(function(err) {
            if (err) {
                return fn(err);
            }
            fn(null);
        });
    }
}

module.exports = LevelDBCache;
