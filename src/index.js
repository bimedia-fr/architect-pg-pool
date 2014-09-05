/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
"use strict";

var async = require('async');

module.exports = function setup(options, imports, register) {
    var pg = require('pg');

    function createPool(config) {
        return {
            'connection': function (cb) {
                pg.connect(config.url, cb);
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
                    res.db.connection = pool.connection;
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
