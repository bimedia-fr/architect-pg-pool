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
 * @typedef {Object} PoolAPI
 * @property {import('pg').Pool} _pool - The underlying pg pool
 * @property {import('pg').Pool['connect']} connection - Get a connection from the pool
 * @property {import('pg').Pool['query']} query - Execute a query on the pool
 * @property {QueryStreamFunction} queryStream - Execute a query and return a promise for the result stream
 */

/**
 * @typedef {(sql: string, params?: unknown[]) => Promise<PassThrough>} QueryStreamFunction
 */

/**
 * create an API for the pg pool.
 * @param {import('pg').Pool} pool 
 * @returns {PoolAPI}
 */
module.exports = function api(pool) {
    function queryStream(sql, params) {
        return pool.connect().then(function (client) {
            const output = new PassThrough({
                'objectMode': true
            });
            const release = once(client.release.bind(client));

            try {
                const stream = client.query(new QueryStream(sql, params));
                stream.once('end', release);
                stream.once('error', function (err) {
                    release();
                    output.emit('error', err);
                });
                output.once('cancel', function () {
                    stream.destroy();
                    release();
                });
                stream.pipe(output);
            } catch (error) {
                release();
                throw error;
            }

            return output;
        });
    }

    return {
        _pool: pool,
        connection: pool.connect.bind(pool),
        query: pool.query.bind(pool),
        queryStream: queryStream
    };
};
