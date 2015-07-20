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

var api = require('./api');


module.exports = function (pool) {

    var rollback = function (client, done) {
        client.query('ROLLBACK', function (err) {
            //if there was a problem rolling back the query
            //something is seriously messed up.  Return the error
            //to the done function to close & remove this client from
            //the pool.  If you leave a client in the pool with an unaborted
            //transaction weird, hard to diagnose problems might happen.
            return done(err);
        });
    };

    pool.transaction = function (cb) {

        pool.connection(function (err, client, done) {

            if (err) {
                return cb(err);
            }

            client.query('BEGIN', function (err) {
                if (err) {
                    rollback(client, done);
                    return cb(err);
                }
                var trx = api(function provider(callback) {
                    callback(null, client, function noop() {});// do not close until commit or rollback
                });
                trx.commit = function trxCommit(callback) {
                    client.query('COMMIT', function (err) {
                        done(err); // close connection
                        callback(err);
                    });
                };
                trx.rollback =  function trxRollback(callback) {
                    rollback(client, function (err) {
                        done(err); // close connection
                        callback(err);
                    });
                };

                cb(null, trx);
            });
        });
    };
    return pool;
};
