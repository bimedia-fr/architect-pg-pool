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
var async = require('async');

var URI = process.env.PG_CON || 'postgresql://localhost:5432/postgres';
var CREATE_TMP = 'CREATE TEMP TABLE beatles(name varchar(25), birthday timestamp)';
var INSERT_SQL = 'INSERT INTO beatles VALUES (\'John Lennon\', date(\'1940-10-09\'))';
var SELECT_SQL = 'SELECT * from beatles';

module.exports = {
    setUp: function (done) {
        var self = this;
        pgpool({
            url: URI
        }, {}, function (err, res) {
            self.pg = res;
            self.pg.db.query(CREATE_TMP, function (err) {
                self.pg.db.query(INSERT_SQL, done);
            });
        });
    },
    tearDown: function (done) {
        if (this.pg) {
            this.pg.onDestroy();
        }
        done();
    },
    testQuery: function (test) {
        this.pg.db.query(SELECT_SQL, function (err, res) {
            test.ifError(err);
            test.equal(res.rows[0].name, 'John Lennon');
            test.done();
        });
    },
    testConnection: function (test) {
        this.pg.db.connection(function (err, con, done) {
            test.ifError(err);
            done();
            test.done();
        });
    },
    testSelectStream: function (test) {
        var stream = this.pg.db.queryStream(SELECT_SQL);
        var count = 0;
        stream.on('data', function (chunk) {
            test.ok(chunk);
            test.equal(chunk.name, 'John Lennon');
            count++;
        });
        stream.on('error', test.ifError);
        stream.on('end', function () {
            test.equal(1, count);
            test.done();
        });
    }
};
