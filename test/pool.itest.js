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
var assert = require("assert"),
  pgpool = require("../src/index"),
  async = require("async");

var URI =
  process.env.PG_CON || "postgresql://testuser:hu8jmn3@localhost:5432/testdb";
var CREATE_TMP =
  "CREATE TEMP TABLE beatles(name varchar(25), birthday timestamp)";
var INSERT_SQL =
  "INSERT INTO beatles VALUES ('John Lennon', date('1940-10-09'))";
var SELECT_SQL = "SELECT * from beatles";

var pg;
before(function() {
  return new Promise(function(resolve, reject) {
    pgpool(
      {
        url: URI,
        max: 2
      },
      {},
      function(err, res) {
        if (err) {
          return reject(err);
        }
        pg = res;
        pg.db.query(CREATE_TMP, function(err) {
          if (err) {
            return reject(err);
          }
          pg.db.query(INSERT_SQL, resolve);
        });
      }
    );
  });
});

after(function() {
  return new Promise(function(resolve, reject) {
    if (pg) {
      pg.onDestroy();
    }
    resolve();
  });
});

describe("architect pg pool", function() {
  describe("default pool", function() {
    it("should return a valid pool", function(done) {
      assert.ok(pg);
      pg.db.query(SELECT_SQL, done);
    });
  });
  describe("pool", function() {
    it("should recover after exhaustion", function(done) {
      count = 0;
      assert.ok(pg);
      function borrow(cb) {
        pg.db.query(SELECT_SQL, function(err, res) {
          if (!err) {
            count++;
          }
          cb(err, res);
        });
      }
      async.parallel([borrow, borrow, borrow, borrow, borrow, borrow], function(
        err,
        res
      ) {
        assert.ifError(err);
        assert.equal(6, count);
        done();
      });
    });
  });
});

exports.testDefaultPool = function(test) {};

exports.testPoolRecoreryAfterExhaustion = function(test) {};
