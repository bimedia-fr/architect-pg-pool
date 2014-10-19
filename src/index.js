/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
"use strict";

var async = require('async');
var QueryStream = require('pg-query-stream');

module.exports = function setup(options, imports, register) {
    var pg = require('pg');

    function createPool(config) {
        return {
            'connection': function (callback) {
                pg.connect(config.url, function (err, handle, done) {
                    callback(err, handle);
                    done();
                });
            },
            'query' : function (sql, params, callback) {
                connection(function (err, handle) {
                    handle.query(sql, params, function (err, res) {
                        callback(err, res);
                    });
                });
            },
            'queryStream' : function (sql, params, callback) {
                connection(function (err, handle) {
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
        connection(function (err, handle) {
            if (err) {
                return cb('unable to create pg connection to ' + pool.url + ' : ' + err);
            }
            cb();
        });
    }

    function createPools(opts) {
        var res = { db : {}};
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
