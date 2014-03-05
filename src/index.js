/*jslint node : true, nomen: true, plusplus: true, vars: true, eqeq: true,*/
"use strict";

module.exports = function setup(options, imports, register) {
    var pg = require('pg');
    var dburl = options.url;

    pg.connect(dburl, function (err, client, done) {
        if (err) {
            return register(err);
        }
        register(null, {db : {
            'connection' : function (cb) {
                pg.connect(dburl, cb);
            }
        }});
    });
};