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

const QueryStream = require('pg-query-stream'),
    PassThrough = require('stream').PassThrough;

/**
 * Create a deferred stream.
 * @param {Function} fn callback function that will be called with the stream
 * @returns {PassThrough}
 */
function deferred(fn) {
    const str = new PassThrough({
        'objectMode': true
    });
    fn(str);
    return str;
}

/**
 * @typedef {Object} PoolAPI
 * @property {import('pg').Pool} _pool - The underlying pg pool
 * @property {Function} connection - Get a connection from the pool
 * @property {Function} query - Execute a query on the pool
 * @property {Function} queryStream - Execute a query and return a stream
 */

/**
 * create an API for the pg pool.
 * @param {import('pg').Pool} pool 
 * @returns {PoolAPI}
 */
module.exports = function api(pool) {

    return {
        _pool: pool,
        connection: pool.connect.bind(pool),
        query: pool.query.bind(pool),
        queryStream: function (/** @type {string} */ sql, /** @type {Array} */ params, /** @type {Function} */ callback) {
            return deferred(function (/** @type {PassThrough} */ str) {
                pool.connect(function (err, handle, done) {
                    if (err || !handle) {
                        const error = err || new Error('Unable to get a connection from the pool');
                        if (callback) {
                            return callback(error);
                        }
                        str.emit('error', error);
                        return;
                    }
                    const query = new QueryStream(sql, params);
                    const stream = handle.query(query);
                    stream.once('end', done);
                    stream.once('error', function (err) {
                        done(); // close conn on error
                        str.emit('error', err); // emit error.
                    });
                    stream.pipe(str);
                    return callback && callback(undefined, str);
                });
            });
        }
    };
};
