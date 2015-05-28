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

var pg = require('pg'),
    QueryStream = require('pg-query-stream');

module.exports = function (config) {
    var result = {
        connection: function (callback) {
            return pg.connect(config.url, callback);
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
};
