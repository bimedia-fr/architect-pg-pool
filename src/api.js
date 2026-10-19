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

var once = require('once'),
    QueryStream = require('pg-query-stream'),
    PassThrough = require('stream').PassThrough;

/**
 * Create a deferred stream.
 * @param {(stream: PassThrough) => void} fn callback function that will be called with the stream
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
 * @property {import('pg').Pool['connect']} connection - Get a connection from the pool
 * @property {import('pg').Pool['query']} query - Execute a query on the pool
 * @property {QueryStreamFunction} queryStream - Execute a query and return a stream
 */

/**
 * @callback QueryStreamCallback
 * @param {Error | undefined} error
 * @param {PassThrough} [stream]
 * @returns {void}
 */

/**
 * @typedef {((sql: string, params: unknown[] | undefined, callback: QueryStreamCallback) => PassThrough) & ((sql: string, params?: unknown[]) => Promise<PassThrough>)} QueryStreamFunction
 */

/**
 * create an API for the pg pool.
 * @param {import('pg').Pool} pool 
 * @returns {PoolAPI}
 */
module.exports = function api(pool) {
    /**
     * @overload
     * @param {string} sql
     * @param {unknown[] | undefined} params
     * @param {QueryStreamCallback} callback
     * @returns {PassThrough}
     */
    /**
     * @overload
     * @param {string} sql
     * @param {unknown[]} [params]
     * @returns {Promise<PassThrough>}
     */
    function queryStream(sql, params, callback) {
        if (!callback) {
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
        return deferred(function (/** @type {PassThrough} */ str) {
            pool.connect(function (err, handle, cb) {
                const done = cb ? once(cb) : function () {};
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
                str.once('cancel', () => { // close conn on cancel to prevent connection leak.
                    stream.destroy();
                    done();
                }); // close conn on cancel.
                stream.pipe(str);
                return callback && callback(undefined, str);
            });
        });
    }

    return {
        _pool: pool,
        connection: pool.connect.bind(pool),
        query: pool.query.bind(pool),
        queryStream: queryStream
    };
};
