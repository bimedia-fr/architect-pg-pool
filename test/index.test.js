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

var pgpool = require('../src/index');

var URI = 'postgresql://localhost:5435/dbname';

function assertPool(pool, test) {
    test.ok(pool, 'pool is defined');
    ['connection', 'query', 'queryStream'].forEach(function (el) {
        test.equal(typeof pool[el], 'function', 'pool has a `' + el + '`  method');
    });
}
module.exports = {
    testDefaultPool: function (test) {
        pgpool({
            url: URI
        }, {}, function (err, res) {
            test.ok(res.db, 'exports a *db* object to architect');
            assertPool(res.db, test);
            test.done();
        });
    },
    testInvalidUrlPool: function (test) {
        pgpool({
            url: 'postgresql://ssvsdvv:qsv[q%c4@host.com:5432/db?ssl=true'
        }, {}, function (err) {
            test.ok(err, 'expect a parse error on url');
            test.done();
        });
    },
    testMultiPool: function (test) {
        pgpool({
            first: {
                url: URI
            },
            second: {
                url: URI
            }
        }, {}, function (err, res) {

            test.ok(res.db, 'exports a *db* object to architect');
            assertPool(res.db.first, test);
            assertPool(res.db.second, test);
            test.ok(!res.db.connection, 'there is no *default* pool : *db.connection* is not avaliable');
            test.done();
        });
    },
    testMultiPoolWithDefault: function (test) {
        pgpool({
            first: {
                url: URI
            },
            second: {
                url: URI,
                "default": true
            }
        }, {}, function (err, res) {

            test.ok(res.db, 'exports a *db* object to architect');
            assertPool(res.db.first, test);
            assertPool(res.db.second, test);
            assertPool(res.db, test);
            test.done();
        });
    }
};
