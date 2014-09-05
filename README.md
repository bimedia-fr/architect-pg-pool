architect-pg-pool
=================

Expose a posgresql connection pool as architect plugin. 

### Installation

```sh
npm install --save architect-pg-pool
```

### Config Format
```js
module.exports = [{
    packagePath: "architect-pg-pool",
    url: 'postgresql://postgresuser:postgrespwd@localhost:5435/dbname',
    checkOnStartUp : true
}];
```
* `url` :  Defines the postgres url to use for connection
* `checkOnStartUp` : Defines if we must check connection validity on startup default is *false*.


### Usage

Boot [Architect](https://github.com/c9/architect) :

```js
var path = require('path');
var architect = require("architect");

var configPath = path.join(__dirname, "config.js");
var config = architect.loadConfig(configPath);

architect.createApp(config, function (err, app) {
    if (err) {
        throw err;
    }
    console.log("app ready");
});
```

Configure Architect with `config.js` :

```js
module.exports = [{
    packagePath: "architect-pg-pool",
    url: 'postgresql://postgresuser:postgrespwd@localhost:5435/dbname'
}, './routes'];
```

Consume *db* plugin in your `./routes/package.json` :

```js
{
  "name": "routes",
  "version": "0.0.1",
  "main": "index.js",
  "private": true,

  "plugin": {
    "consumes": ["db"]
  }
}
```
Eventually use pg connection in your routes `./routes/index.js` :

```js
module.exports = function setup(options, imports, register) {
    var rest = imports.rest;
    var db = imports.db;

    // register routes 
    rest.get('/hello/:name', function (req, res, next) {
        db.connection(function (err, client, done) {
            client.query('SELECT * FROM Users WHERE id=$1', [req.params.name], 
                function(err, res){
                    done();
                    res.write("{'message':'hello," + res.rows[0].name + "'}");
                    res.end();
            });
        });
    });
    
    register();
};
```
### Multiple pool configuration
This module supports multiple pools.

Here is how to define 2 different pools :
```js
module.exports = [{
    packagePath: "architect-pg-pool",
    first : {
    	url: 'postgresql://postgresuser:postgrespwd@localhost:5435/dbname'
    },
	second : {
    	url: 'postgresql://postgresuser:postgrespwd@localhost:5432/otherdb'
    },
    checkOnStartUp : true
}];
```
This will create 2 properties (`first` and `second`) in the `db` object.

```js
module.exports = function setup(options, imports, register) {
    var db = imports.db;
    db.first.connection(function (err, client, done) {
      client.query('SELECT * FROM Users WHERE id=$1', [req.params.name], 
        function(err, res){
          done();
          res.write("{'message':'hello," + res.rows[0].name + "'}");
          res.end();
      });
    });    
    register();
};
```