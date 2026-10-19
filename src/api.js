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

var once = require('once'),
    QueryStream = require('pg-query-stream'),
    PassThrough = require('stream').PassThrough;

function deferred(fn) {
    var str = new PassThrough({
        'objectMode': true
    });
    fn(str);
    return str;
}

module.exports = function api(pool) {

    function queryStream(sql, params, callback) {
        if (typeof callback !== 'function') {
            return new Promise(function (resolve, reject) {
                queryStream(sql, params, function (err, stream) {
                    if (err) {
                        return reject(err);
                    }
                    if (!stream) {
                        return reject(new Error('Query stream was not created'));
                    }
                    resolve(stream);
                });
            });
        }
        return deferred(function (str) {
            pool.connect(function (err, handle, cb) {
                const done = cb ? once(cb) : function () {};
                if (err || !handle) {
                    const error = err || new Error('Unable to get a connection from the pool');
                    return callback(error);
                }
                var query = new QueryStream(sql, params);
                var stream = handle.query(query);
                stream.once('end', () => {
                    done();
                });
                stream.once('error', function (err) {
                    done(); // close conn on error
                    str.emit('error', err); // emit error.
                });
                str.once('cancel', () => { // close conn on cancel to prevent connection leak.
                    stream.destroy();
                    done();
                }); // close conn on cancel.
                stream.pipe(str);
                return callback(undefined, str);
            });
        });
    }

    var result = {
        _pool: pool,
        connection: pool.connect.bind(pool),
        query: pool.query.bind(pool),
        queryStream: queryStream
    };
    return result;
};
