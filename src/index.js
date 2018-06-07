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

var createPool = require('./pool');
var async = require('async');
var pg = require('pg');

var TSTAMP_WO_TZ =  1114;

module.exports = function setup(options, imports, register) {

    if (!options.defaultTimezoneUTC) {
        var oldParser = pg.types.getTypeParser(TSTAMP_WO_TZ);
        pg.types.setTypeParser(TSTAMP_WO_TZ, function (str) {
            var date = oldParser(str);
            return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
        });
    }

    function checkConnection(pool, cb) {
        pool.connection(function (err, handle, done) {
            if (err) {
                return cb(new Error('unable to create pg connection to ' + pool.url + ' : ' + err));
            }
            done();
            cb();
        });
    }

    function createPools(opts) {
        var pools = [];
        var res = {
            db: {},
            onDestroy: function () {
                pools.forEach(function (p) {
                    p.end();
                });
            }
        };
        if (opts.url) {
            res.db = createPool(opts.url);
            pools.push(res.db._pool);
        }
        Object.keys(opts).forEach(function (key) {
            if (opts[key] && opts[key].url) {
                var pool = createPool(opts[key].url);
                pools.push(pool._pool);
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

    var pools;
    try {
        pools = createPools(options);
    } catch (e) {
        return register(e);
    }

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
