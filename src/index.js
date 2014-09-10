/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
"use strict";

var async = require('async'),
    QueryStream = require('pg-query-stream');

module.exports = function setup(options, imports, register) {
    var pg = require('pg');

    function createPool(config) {
        return {
            'connection': function (callback) {
                pg.connect(config.url, callback);
            },
            'query' : function (sql, params, callback) {
                pg.connect(config.url, function (err, handle, done) {
                    handle.query(sql, params, function (err, res) {
                        done();
                        callback(err, res);
                    });
                });
            },
            'queryStream' : function (sql, params, callback) {
                pg.connect(config.url, function (err, handle, done) {
                    if (err) {
                        return callback(err);
                    }
                    var query = new QueryStream(sql, params);
                    var stream = handle.query(query);
                    stream.once('end', done);
                    callback(null, stream);
                });
            }
        };
    }

    function checkConnection(pool, cb) {
        pool.connection(function (err, client, done) {
            if (err) {
                return cb('unable to create pg connection to ' + pool.url + ' : ' + err);
            }
            done();
            cb();
        });
    }

    function createPools(opts) {
        var res = { db : {}};
        var dburl = options.url;
        if (opts.url) {
            res.db = createPool(opts);
        }
        Object.keys(opts).forEach(function (key) {
            if (opts[key] && opts[key].url) {
                var pool = createPool(opts[key]);
                res.db[key] = pool;
                if (opts[key]['default']) {
                    Object.keys(pool).forEach(function (key) {
                        res.db[key] = pool[key];
                    });
                }
            }
        });
        return res;
    }

    var pools = createPools(options);

    if (options.checkOnStartUp) {
        var filtered = Object.keys(pools).filter(function (key) {
            return pools[key].connection;
        }).map(function (el) {
            return pools[el];
        });
        async.each(filtered, checkConnection, function (err) {
            if (err) {
                return register(err);
            }
            register(null, pools);
        });
    } else {
        register(null, pools);
    }
};
