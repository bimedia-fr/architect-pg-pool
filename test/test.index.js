/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
"use strict";

var assert = require('assert'), vows = require('vows');
var pgpool = require('../src/index');

vows.describe('pg pool').addBatch({

    'create a default unamed pool': {
        topic: function () {
            return pgpool({url: 'postgresql://localhost:5435/dbname'}, {}, this.callback);
        },
        'returns a pool object with a *connection* method ' : function (res) {
            assert.ok(res.db.connection);
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
            assert.ok(res.db.first);
            assert.ok(res.db.first.connection);
        },
        'returns a pool named *second* with a *connection* method ' : function (res) {
            assert.ok(res.db.second);
            assert.ok(res.db.second.connection);
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
            assert.ok(res.db.first);
            assert.ok(res.db.first.connection);
        },
        'returns a pool named *second* with a *connection* method ' : function (res) {
            assert.ok(res.db.second);
            assert.ok(res.db.second.connection);
        },
        'there is a pool marked as *default* which is avaliable under *db* ' : function (res) {
            assert.ok(res.db);
            assert.ok(res.db.connection);
        }
    }
}).exportTo(module);

