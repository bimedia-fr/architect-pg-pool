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

var assert = require('assert'), vows = require('vows');
var pgpool = require('../src/index');

function assertPool(pool) {
    assert.isObject(pool, 'pool is defined');
    assert.isFunction(pool.connection, 'pool has a `connection`  method');
    assert.isFunction(pool.query, 'pool has a `query`  method');
    assert.isFunction(pool.queryStream, 'pool has a `queryStream` method');
}

var URI = 'postgresql://localhost:5435/dbname';

vows.describe('pg pool').addBatch({
    
    'create a default unamed pool': {
        topic: function () {
            return pgpool({url: URI}, {}, this.callback);
        },
        'returns a pool object with a *connection* method ' : function (res) {
            assert.isFunction(res.db.connection);
        },
        'returns a pool object with a *query* method ' : function (res) {
            assert.isFunction(res.db.query);
        },
        'returns a pool object with a *queryStream* method ' : function (res) {
            assert.isFunction(res.db.queryStream);
        },
        'exports a *db* object to architect ' : function (res) {
            assert.isObject(res.db);
        }
    },
    'create a multi pools': {
        topic: function () {
            return pgpool({
                first : {
                    url: URI
                },
                second : {
                    url: URI
                }
            }, {}, this.callback);
        },
        'exports a *db* object to architect ' : function (res) {
            assert.isObject(res.db);
        },
        'returns a pool named *first* with a *connection* method ' : function (res) {
            assertPool(res.db.first);
        },
        'returns a pool named *second* with a *connection* method ' : function (res) {
            assertPool(res.db.second);
        },
        'there is no *default* pool : *db.connection* is not avaliable ' : function (res) {
            assert.isUndefined(res.db.connection);
        }
    },
    'create a multi pools with a default': {
        topic: function () {
            return pgpool({
                first : {
                    url: URI
                },
                second : {
                    url: URI,
                    'default':  true
                }
            }, {}, this.callback);
        },
        'exports a *db* object to architect ' : function (res) {
            assertPool(res.db);
        },
        'returns a pool named *first* with a *connection* method ' : function (res) {
            assertPool(res.db.first);
        },
        'returns a pool named *second* with a *connection* method ' : function (res) {
            assertPool(res.db.second);
        },
        'there is a pool marked as *default* which is avaliable under *db* ' : function (res) {
            assertPool(res.db.first);
        }
    }
}).exportTo(module);

