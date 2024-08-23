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
var assert = require('assert');
var pgpool = require('../src/index');
var logger = require('./logger.mock');

var URI = 'postgresql://localhost:5435/dbname';

function assertPool(pool) {
    var test = assert;
    test.ok(pool, 'pool is defined');
    ['connection', 'query', 'queryStream'].forEach(function (el) {
        test.equal(typeof pool[el], 'function', 'pool has a `' + el + '`  method');
    });
}

describe('architect pg pool', function(){
    describe('default pool', function() {
        it('should export a *db* object to architect', function (done) {
            pgpool({
                url: URI
            }, {log: logger}, function (err, res) {
                assert.ifError(err);
                assert.ok(res.db, 'exports a *db* object to architect');
                assertPool(res.db);
                done();
            });
        });
        it('should throw an error with invalid url', function(done){
            pgpool({
                url: 'postgresql://ssvsdvv:qsv[q%c4@host.com:5432/db?ssl=true'
            }, {log: logger}, function (err) {
                assert.ok(err, 'expect a parse error on url');
                done();
            });    
        });
    });
    describe('multipool', function () {
        it('should export a db object', function (done) {
            pgpool({
                first: {
                    url: URI
                },
                second: {
                    url: URI
                }
            }, {log: logger}, function (err, res) {
                assert.ifError(err);
                assert.ok(res.db, 'exports a *db* object to architect');
                assertPool(res.db.first);
                assertPool(res.db.second);
                assert.ok(!res.db.connection, 'there is no *default* pool : *db.connection* is not avaliable');
                done();
            });
    
        });
    });
    describe('multipool with default', function(){
        it('should export a db object to architect', function (done) {
            pgpool({
                first: {
                    url: URI
                },
                second: {
                    url: URI,
                    "default": true
                }
            }, {log: logger}, function (err, res) {
                assert.ifError(err);
                assert.ok(res.db, 'exports a *db* object to architect');
                assertPool(res.db.first);
                assertPool(res.db.second);
                assertPool(res.db);
                done();
            });
        });
    });
});
