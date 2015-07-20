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
            self.pg.db.query(CREATE_TMP, [], done);
        });
    },
    tearDown: function (done) {
        this.pg.onDestroy();
        done();
    },
    testCreateEmptyTrx: function (test) {
        this.pg.db.transaction(function (err, trx)  {
            test.ifError(err);
            trx.commit(function (err, res) {
                test.ifError(err);
                test.done();
            });
        });
    },
    testCreateEmptyTrxRollback: function (test) {
        this.pg.db.transaction(function (err, trx)  {
            test.ifError(err);
            trx.rollback(function (err, res) {
                test.ifError(err);
                test.done();
            });
        });
    },
    testTrxSelectCommit: function (test) {
        this.pg.db.transaction(function (err, trx)  {
            async.series([
                async.apply(trx.query.bind(trx), INSERT_SQL, []),
                async.apply(trx.query.bind(trx), SELECT_SQL, [])
            ], function (err, res) {
                test.ifError(err);
                trx.commit(function (err) {
                    test.ifError(err);
                    test.equal(1, res[1].rowCount);
                    test.done();
                })
            });
        });
    },
    testTrxSelectStreamCommit: function (test) {
        this.pg.db.transaction(function (err, trx)  {
            trx.query(INSERT_SQL, [], function (err, res) {
                test.ifError(err);
                var count = 0;
                var stream = trx.queryStream(SELECT_SQL);
                stream.on('data', function(chunk) {
                    test.ok(chunk);
                    count++;
                });
                stream.on('error', test.ifError);
                stream.on('end', function(){
                    trx.commit(function (err) {
                        test.ifError(err);
                        test.equal(1, count);
                        test.done();
                    });
                });
            });
        });
    },
    testTrxSelectRollback: function (test) {
        this.pg.db.transaction(function (err, trx)  {
            async.series([
                async.apply(trx.query.bind(trx), INSERT_SQL, []),
                async.apply(trx.query.bind(trx), SELECT_SQL, [])
            ], function (err, res) {
                test.ifError(err);
                trx.rollback(function (err) {
                    test.ifError(err);
                    test.equal(1, res[1].rowCount);
                    test.done();
                })
            });
        });
    },
    testTrxCommit: function (test) {
        this.pg.db.transaction(function (err, trx)  {
            async.series([
                async.apply(trx.query.bind(trx), INSERT_SQL, []),
                async.apply(trx.commit.bind(trx)),
                async.apply(trx.query.bind(trx), SELECT_SQL, [])
            ], function (err, res) {
                test.ifError(err);
                test.equal(1, res[2].rowCount);
                test.done();
            });
        });
    },
    testTrxRollback: function (test) {
        this.pg.db.transaction(function (err, trx)  {
            async.series([
                async.apply(trx.query.bind(trx), INSERT_SQL, []),
                async.apply(trx.rollback.bind(trx)),
                async.apply(trx.query.bind(trx), SELECT_SQL, [])
            ], function (err, res) {
                test.ifError(err);
                test.equal(0, res[2].rowCount);
                test.done();
            });
        });
    },
    testErrorTrx: function (test) {
        this.pg.db.transaction(function (err, trx)  {
            async.series([
                async.apply(trx.query.bind(trx), INSERT_SQL, []),
                async.apply(trx.query.bind(trx), 'SELECT * from wtf', []),
                async.apply(trx.commit.bind(trx))
            ], function (err, res) {
                test.ok(err);
                if (err) {
                    trx.rollback(test.done);
                    return;
                }
                test.fail('error expected');
            });
        });
    }
};
