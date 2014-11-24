/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
/* 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use strict";

var async = require('async');
var QueryStream = require('pg-query-stream');

module.exports = function setup(options, imports, register) {
    var pg = require('pg');

    function createPool(config) {
        var result = {
            connection: function (callback) {
                pg.connect(config.url, callback);
            },
            query: function (sql, params, callback) {
                result.connection(function (err, handle, done) {
                    if (err) {
                        return callback(err);
                    }
                    handle.query(sql, params, function (err, res) {
                        callback(err, res);
                        done();
                    });
                });
            },
            queryStream: function (sql, params, callback) {
                result.connection(function (err, handle, done) {
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
        return result;
    }

    function checkConnection(pool, cb) {
        pool.connection(function (err, handle) {
            if (err) {
                return cb('unable to create pg connection to ' + pool.url + ' : ' + err);
            }
            cb();
        });
    }

    function createPools(opts) {
        var res = {
            db: {}
        };
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
    } else {
        register(null, pools);
    }
};
