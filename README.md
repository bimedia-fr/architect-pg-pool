architect-pg-pool [![build status](https://secure.travis-ci.org/bimedia-fr/architect-pg-pool.png)](https://travis-ci.org/bimedia-fr/architect-pg-pool)
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
      client.query(/*...*/);
    });    
    register();
};
```
#### default pool
A pool can be marked as default and will be available in `db.connection`.
Here is how to define 2 different pools with the second as default :
```js
module.exports = [{
    packagePath: "architect-pg-pool",
    first : {
    	url: 'postgresql://postgresuser:postgrespwd@localhost:5435/dbname'
    },
	second : {
    	url: 'postgresql://postgresuser:postgrespwd@localhost:5432/otherdb',
        'default' : true
    },
    checkOnStartUp : true
}];
```
This will create 2 properties (`first` and `second`) in the `db` object.
```js
module.exports = function setup(options, imports, register) {
    var db = imports.db;
    // this will use second pool
    db.connection(function (err, client, done) {
      client.query(/*...*/);
    });
    // second pool is also available
    db.second.connection(function (err, client, done) {
      client.query(/*...*/);
    });
    register();
};
```
### API
The pool object (`db`) has the following methods :

#### connection
Retreive a connection from the pool. The method takes a callback as parameter. Once the connection is avaliable the callback is called with an :

* `err` object if an error occured or null;
* `client` the pg client object.

#### query
The `query` method let you directly query the database without worrying about the database connection. Behind the scene the method retreive a connection from the pool and close it afterward. The method signature is similar to [node-pg query](https://github.com/brianc/node-postgres/wiki/Client#simple-queries).
* _string_ text: the query text
* optional _array_ parameters: the query parameters
* optional _function_ callback : the function called when data is ready

Once the data is ready the callback is fired with an :

* `err` object if an error occured or null,
* `rows` the pg result set.

#### queryStream
The `queryStream` method let you directly query the database without worrying about the database connection. This method passes a stream to the callback instead of a resultset. Behind the scene the method retreive a connection from the pool and close it afterward. The method signature is similar to [node-pg query-stream](https://github.com/brianc/node-pg-query-stream#pg-query-stream).
* _string_ text: the query text
* optional _array_ parameters: the query parameters
* optional _function_ callback : the function called when stream is ready

Once the stream is ready the callback is fired with an :

* `err` object if an error occured or null,
* `stream` the pg  result stream.