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
    url = require('url'),
    api = require('./api');

module.exports = function (config) {
    var params, auth, pool;
    if (typeof config === 'string') {
        params = url.parse(config);
        auth = params.auth ? params.auth.split(':') : [];
        config = {
            host: params.hostname,
            port: params.port,
            database: params.pathname.split('/')[1],
            ssl: true,
        };
        if (auth.length > 0) {
            config.user = auth[0];
            config.password = auth[1];
        }
    }
    pool = new pg.Pool(config);
    pool.on('error', console.log);
    return api(pool);
};
