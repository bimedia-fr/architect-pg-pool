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

const createPool = require('./pool');
const pg = require('pg');

const TSTAMP_WO_TZ =  1114;

/**
 * @typedef {Object.<string, import('./pool').PoolConfig>} ModulePoolsConfig
 */

/**
 * @typedef {Object} ModuleOptions
 * @property {String} [defaultTimezoneUTC] - If set, the default timezone will be UTC
 * @property {Boolean} [checkOnStartUp] - If true, check the connection to the database on startup
 * @property {ModulePoolsConfig} pools - Configuration for the database pools
 */

/**
 * @typedef {Object} ModuleExport
 * @property {Object.<string, import('./api').PoolAPI>} db
 * @property {Function} onDestroy
 */

/**
 * @typedef {Object} ModuleImports
 * @property {import('node:stream').EventEmitter} hub
 * @property {import('architect-log4js').Log4jsWithRequest} log
 */

/**
 * @param {ModuleOptions} options
 * @param {ModuleImports} imports
 * @param  {function (Error|null, ModuleExport|null):void}  register
 */
module.exports = function setup(options, imports, register) {

    const logger = imports.log;
    const log = logger.getLogger('pg');

    if (!options.defaultTimezoneUTC) {
        var oldParser = pg.types.getTypeParser(TSTAMP_WO_TZ);
        pg.types.setTypeParser(TSTAMP_WO_TZ, function (str) {
            var date = oldParser(str);
            return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
        });
    }

    /**
     * Check the connection to the database
     * @param {String} key - The key of the database connection
     * @returns {Promise<void>}
     */
    function checkConnection(key) {
        log.info(`Check: "${key}" started`);
        let timer = Date.now();
        return pools.db[key].connection().then(client => {
            client.release();
            log.info(`Check: "${key}" connection OK (${Date.now() - timer}ms)`);
        }).catch(err => {
            log.error(`Check: "${key}" connection Failed (${Date.now() - timer}ms)`);
            throw new Error('unable to create pg connection to ' + pools.db[key] + ' : ' + err);
        });
    }

    /**
     * Create a pool of database connections
     * @param {ModulePoolsConfig} opts
     * @returns {ModuleExport} The created pools
     */
    function createPools(opts) {
        /**
         * @type {import('pg').Pool[]}
         */
        let pools = [];

        /**
         * @type {ModuleExport} - The pools object
         */
        let res = {
            db: {},
            onDestroy: function () {
                pools.forEach(function (p) {
                    p.end();
                });
            }
        };

        Object.keys(opts).forEach(function (key) {
            if (opts[key]) {
                var pool = createPool(key, opts[key], logger.getLogger('pg-' + key));
                pools.push(pool._pool);
                res.db[key] = pool;
            }
        });
        return res;
    }

    var pools;
    try {
        log.debug('Creating pools', Object.keys(options.pools));
        pools = createPools(options.pools || {});
    } catch (e) {
        log.error('Error creating pools', e);
        const err = e instanceof Error ? e : new Error(String(e));
        return register(err, null);
    }

    if (options.checkOnStartUp) {
        log.info('Checking Pools connections on startup');
        let filtered = Object.keys(pools.db).filter(function (key) {
            return pools.db[key].connection;
        }).map(function (key) {
            return key;
        });
        return Promise.all(filtered.map(checkConnection)).then(result => {
            register(null, pools);
        }).catch(err => {
            return register(err, null);
        });
    }
    register(null, pools);
};

module.exports.consumes = ['log']
module.exports.provides = ['db']
