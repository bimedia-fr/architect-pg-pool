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

var URI = process.env.PG_CON || 'postgresql://testuser:hu8jmn3@localhost:5432/testdb';
var CREATE_TMP = 'CREATE TEMP TABLE beatles(name varchar(25), birthday timestamp)';
var INSERT_SQL = 'INSERT INTO beatles VALUES (\'John Lennon\', date(\'1940-10-09\'))';
var SELECT_SQL = 'SELECT * from beatles';

var pg;
before(function() {
    return new Promise(function(resolve, reject) {
        pgpool({
            url: URI
        }, {}, function (err, res) {
            if (err) {
                return reject(err);
            }
            pg = res;
            pg.db.query(CREATE_TMP, function (err) {
                if (err) {
                    return reject(err);
                }
                pg.db.query(INSERT_SQL, resolve);
            });
        });
    });
});

after(function (){
    return new Promise(function (resolve, reject) {
        if (pg) {
            pg.onDestroy();
        }
        resolve();
    });
});

describe('architect pg pool', function () {
    describe('query', function() {
        it('should query database', function (done) {
            pg.db.query(SELECT_SQL, function (err, res) {
                assert.ifError(err);
                assert.equal(res.rows[0].name, 'John Lennon');
                done();
            });
        });
    });
    describe('connection', function () {
        it('should return a valid pg connection', function(done) {
            pg.db.connection(function (err, con, close) {
                assert.ifError(err);
                assert.ok(con);
                close();
                done();
            });
        });
    });
    describe('select stream', function(){
        it('should return a result stream', function (done){
            var stream = pg.db.queryStream(SELECT_SQL);
            var count = 0;
            stream.on('data', function (chunk) {
                assert.ok(chunk);
                assert.equal(chunk.name, 'John Lennon');
                count++;
            });
            stream.on('error', assert.ifError);
            stream.on('end', function () {
                assert.equal(1, count);
                done();
            });
        });
    });
});
