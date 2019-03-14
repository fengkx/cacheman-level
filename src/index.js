const level = require('level');
const ttl = require('level-ttl');
const Promise = require('any-promise');

class LevelDBCache {
    constructor(location, options, cb) {
        let db, checkFrequency, prefix;
        if (!location)
            throw new Error('You should proide a location to store data');
        if (typeof options === 'function') {
            cb = options;
            options = null;
        }
        if (options) {
            db = level(location, options);
            checkFrequency = options.checkFrequency;
            prefix = options.prefix;
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

    set(key, value, ttl, fn) {
        if (typeof ttl === 'function') {
            fn = ttl;
            ttl = null;
        }
        if (typeof key !== 'string')
            throw new Error('key store in LevelDB must be string');
        const k = `${this.prefix}${key}`;
        try {
            value = JSON.stringify(value);
        } catch (e) {
            fn(e);
        }
        if (ttl === -1 || !ttl) {
            if (fn) {
                this.db.put(k, value, function(err) {
                    if (err) {
                        return fn(err);
                    }
                    fn(null, value);
                });
            } else {
                return new Promise((resolve, reject) => {
                    this.db.put(k, value, function(err) {
                        if (err) {
                            reject(err);
                        }
                        resolve(value);
                    });
                });
            }
        } else if (fn) {
            this.db.put(k, value, { ttl: ttl * 1000 }, function(err) {
                if (err) {
                    return fn(err);
                }
                fn(null, value);
            });
        } else {
            return new Promise((resolve, reject) => {
                this.db.put(k, value, { ttl: ttl * 1000 }, function(err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(value);
                });
            });
        }
    }

    get(key, fn) {
        if (typeof key !== 'string')
            throw new Error('key store in LevelDB must be string');
        const k = `${this.prefix}${key}`;
        if (fn) {
            this.db.get(k, function(err, value) {
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
        } else {
            return new Promise((resolve, reject) => {
                this.db.get(k, function(err, value) {
                    if (err) {
                        if (err.notFound) {
                            resolve(null);
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve(JSON.parse(value));
                    }
                });
            });
        }
    }

    del(key, fn) {
        if (typeof key !== 'string')
            throw new Error('key store in LevelDB must be string');
        if (fn) {
            this.db.del(key, function(err) {
                fn(err);
            });
        } else {
            return new Promise((resolve, reject) => {
                this.db.del(key, function(err) {
                    if (err) return reject(err);
                    resolve();
                });
            });
        }
    }

    clear(fn) {
        if (fn) {
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
        } else {
            return new Promise((resolve, reject) => {
                this.db
                    .createKeyStream()
                    .on('data', (key) => {
                        this.db.del(key, function(err) {
                            if (err) reject(err);
                        });
                    })
                    .on('end', function() {
                        resolve();
                    });
            });
        }
    }
    close(fn) {
        if (fn) {
            this.db.close(function(err) {
                if (err) {
                    return fn(err);
                }
                fn(null);
            });
        } else {
            return new Promise((resolve, rejcet) => {
                this.db.close(function(err) {
                    if (err) {
                        return rejcet(err);
                    }
                    resolve(null);
                });
            });
        }
    }
}

module.exports = LevelDBCache;
