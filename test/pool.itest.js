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

var URI = process.env.PG_CON || 'postgresql://localhost:5432/postgres';

exports.setUp = function (done) {
    var self = this;
    pgpool({
        url: URI
    }, {}, function (err, res) {
        self.pg = res;
        done(err, res);
    });
};

exports.tearDown = function (done) {
    this.pg.onDestroy();
    done();
};

var CREATE_TMP = 'CREATE TEMP TABLE beatles(name varchar(10), birthday timestamp)';

exports.testDefaultPool = function (test) {
    test.ok(this.pg);
    this.pg.db.query(CREATE_TMP, test.done);
};
