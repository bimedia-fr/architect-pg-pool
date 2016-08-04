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

var pgpool = require('../src/index'),
    async = require('async');

var URI = process.env.PG_CON || 'postgresql://localhost:5432/postgres';
var CREATE_TMP = 'CREATE TEMP TABLE beatles(name varchar(25), birthday timestamp)';
var INSERT_SQL = 'INSERT INTO beatles VALUES (\'John Lennon\', date(\'1940-10-09\'))';
var SELECT_SQL = 'SELECT * from beatles';

exports.setUp = function (done) {
    var self = this;
    pgpool({
        url: {
            user: 'postgres',
            database: 'postgres',
            password: 'postgres',
            max: 2
        }
    }, {}, function (err, res) {
        self.pg = res;
        self.pg.db.query(CREATE_TMP, function (err) {
            self.pg.db.query(INSERT_SQL, done);
        });
    });
};

exports.tearDown = function (done) {
    if (this.pg) {
        this.pg.onDestroy();
    }
    done();
};

exports.testDefaultPool = function (test) {
    test.ok(this.pg);
    this.pg.db.query(SELECT_SQL, test.done);
};

exports.testPoolRecoreryAfterExhaustion = function (test) {
    var self = this, count = 0;
    test.ok(self.pg);
    function borrow(cb) {
        self.pg.db.query(SELECT_SQL, function (err, res) {
            if (!err) {
                count++;
            }
            cb(err, res);
        });
    }
    async.parallel([
        borrow,
        borrow,
        borrow,
        borrow,
        borrow,
        borrow
    ], function (err, res) {
        test.ifError(err);
        test.equal(6, count);
        test.done();
    });
};
