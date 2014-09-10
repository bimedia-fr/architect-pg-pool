/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
"use strict";

var assert = require('assert'), vows = require('vows');
var pgpool = require('../src/index');

function assertPool(pool) {
    assert.ok(pool);
    assert.ok(pool.connection);
    assert.ok(pool.query);
    assert.ok(pool.queryStream);
}


vows.describe('pg pool').addBatch({

    'create a default unamed pool': {
        topic: function () {
            return pgpool({url: 'postgresql://localhost:5435/dbname'}, {}, this.callback);
        },
        'returns a pool object with a *connection* method ' : function (res) {
            assert.ok(res.db.connection);
        },
        'returns a pool object with a *query* method ' : function (res) {
            assert.ok(res.db.query);
        },
        'returns a pool object with a *queryStream* method ' : function (res) {
            assert.ok(res.db.queryStream);
        },
        'exports a *db* object to architect ' : function (res) {
            assert.ok(res.db);
        }
    },
    'create a multi pools': {
        topic: function () {
            return pgpool({
                first : {
                    url: 'postgresql://localhost:5435/dbname'
                },
                second : {
                    url: 'postgresql://localhost:5432/dbname'
                }
            }, {}, this.callback);
        },
        'exports a *db* object to architect ' : function (res) {
            assert.ok(res.db);
        },
        'returns a pool named *first* with a *connection* method ' : function (res) {
            assertPool(res.db.first);
        },
        'returns a pool named *second* with a *connection* method ' : function (res) {
            assertPool(res.db.second);
        },
        'there is no *default* pool : *db.connection* is not avaliable ' : function (res) {
            assert.ok(!res.db.connection);
        }
    },
    'create a multi pools with a default': {
        topic: function () {
            return pgpool({
                first : {
                    url: 'postgresql://localhost:5435/dbname'
                },
                second : {
                    url: 'postgresql://localhost:5432/dbname',
                    'default':  true
                }
            }, {}, this.callback);
        },
        'exports a *db* object to architect ' : function (res) {
            assert.ok(res.db);
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

