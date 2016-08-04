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

var QueryStream = require('pg-query-stream'),
    PassThrough = require('stream').PassThrough;

function deferred(fn) {
    var str = new PassThrough({
        'objectMode': true
    });
    fn(str);
    return str;
}

module.exports = function api(pool) {

    var result = {
        _pool: pool,
        connection: pool.connect.bind(pool),
        query: pool.query.bind(pool),
        queryStream: function (sql, params, callback) {
            return deferred(function (str) {
                result.connection(function (err, handle, done) {
                    if (err) {
                        if (callback) {
                            return callback(err);
                        }
                        str.emit('error', err);
                        return;
                    }
                    var query = new QueryStream(sql, params);
                    var stream = handle.query(query);
                    stream.once('end', done);
                    stream.pipe(str);
                    return callback && callback(undefined, str);
                });
            });
        }
    };
    return result;
};
