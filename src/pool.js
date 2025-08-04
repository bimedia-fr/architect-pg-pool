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
const pg = require('pg'),
    api = require('./api');
/** 
 * @typedef {Object} CustomPoolConfig
 * @property {String} [validationQuery] - A query to validate the connection
 * @property {Function} [validateAsync] - A function to validate the connection asynchronously
 */

/**
 * @typedef {pg.PoolConfig & CustomPoolConfig} PoolConfig
 */

/**
 * Create a PostgreSQL connection pool.
 * @param {string} name - The name of the pool.
 * @param {PoolConfig} config - The connection configuration.
 * @param {import('log4js').Logger} log - The logger instance.
 * @returns {import('./api').PoolAPI} - The PostgreSQL connection pool.
 */
module.exports = function (name, config, log) {
    let pool, query;
    if (typeof config === 'string') {
        // url as string is unsupported
        throw new Error('String connection URLs are not supported. Use an object instead.');
    }
    if (config.validationQuery) {
        query = typeof config.validationQuery == 'string' ? config.validationQuery : 'SELECT 1';
        config.validateAsync = function (con, cb) {
            con.query(query, function (err, res) {
                cb(!err && res);
            });
        };
        delete config.validationQuery;
    }
    pool = new pg.Pool(config);
    pool.on('error', (err) => {
        log.error('pg pool', name, 'recieved an error', err);
    });
    return api(pool);
};
