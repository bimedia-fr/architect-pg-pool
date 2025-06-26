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

module.exports = function setup(options, imports, register) {

    const logger = imports.log;
    const log = logger.getLogger('pg-init');

    if (!options.defaultTimezoneUTC) {
        var oldParser = pg.types.getTypeParser(TSTAMP_WO_TZ);
        pg.types.setTypeParser(TSTAMP_WO_TZ, function (str) {
            var date = oldParser(str);
            return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
        });
    }

    function checkConnection(poolsDb, key) {
        log.info(`Check: "${key}" started`);
        let timer = Date.now();
        return poolsDb[key].connection().then(client => {
            client.release();
            log.info(`Check: "${key}" connection OK (${Date.now() - timer}ms)`);
        }).catch(err => {
            log.error(`Check: "${key}" connection Failed (${Date.now() - timer}ms)`);
            throw new Error('unable to create pg connection to ' + poolsDb[key] + ' : ' + err);
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
            res.db = createPool('default', opts.url, logger.getLogger('pg-default'));
            pools.push(res.db._pool);
        }
        Object.keys(opts).forEach(function (key) {
            if (opts[key] && opts[key].url) {
                var pool = createPool(key, opts[key].url, logger.getLogger('pg-' + key));
                pools.push(pool._pool);
                res.db[key] = pool;
                if (opts[key]['default']) {
                    Object.keys(pool).forEach(function (key) {
                        res.db[key] = pool[key];
                    });
                }
            }
        });
        // Notice: pools are registered in res.db
        return res;
    }

    let pools;
    try {
        log.info('Creating pools...');
        pools = createPools(options);
    } catch (e) {
        log.error('Error creating pools', e);
        return register(e);
    }
    log.info(`${Object.keys(pools.db).length} pools created (${Object.keys(pools.db).join(', ')})`);

    if (options.checkOnStartUp) {
        log.info('Checking Pools connections on startup...');
        let filtered = Object.keys(pools.db).filter(function (key) {
            return typeof pools.db[key].connection;
        }).map(function (key) {
            return key;
        });
        return Promise.all(filtered.map(checkConnection.bind(null,pools.db))).then(result => {
            register(null, pools);
        }).catch(err => {
            return register(err);
        });
    }
    register(null, pools);
};

module.exports.consumes = ['log']
module.exports.provides = ['db']