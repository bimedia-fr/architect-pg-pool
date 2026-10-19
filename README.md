architect-pg-pool [![build status](https://secure.travis-ci.org/bimedia-fr/architect-pg-pool.png)](https://travis-ci.org/bimedia-fr/architect-pg-pool)
=================

Expose a posgresql connection pool as architect plugin. Automaticaly returns connection to the pool after query.

### Installation

```sh
npm install --save architect-pg-pool
```

### Config Format
```js
module.exports = [{
    packagePath: "architect-pg-pool",
    pools: {
        poolname: {
            user: 'dbuser',
            password: process.env.DB_PASSWORD,
            host: 'db.example.com',
            port: 5432,
            database: 'dbname'
        }
    }
    checkOnStartUp : true
}];
```
* `pools` :  Defines the postgres pools to use
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
    pools: {
        poolname: {
            user: 'dbuser',
            password: process.env.DB_PASSWORD,
            host: 'db.example.com',
            port: 5432,
            database: 'dbname',
            ssl: {
                rejectUnauthorized: false
            },
            application_name: 'myapp',
            max: 2
        }
    }
}, './routes'];
```

Consume *pgdb* plugin in your `./routes/package.json` :

```js
{
  "name": "routes",
  "version": "0.0.1",
  "main": "index.js",
  "private": true,

  "plugin": {
    "consumes": ["pgdb"]
  }
}
```
Eventually use pg connection in your routes `./routes/index.js` :

```js
module.exports = function setup(options, imports, register) {
    var rest = imports.rest;
    var db = imports.pgdb;

    // register routes 
    rest.get('/hello/:name', function (req, res, next) {
        db.poolname.query('SELECT * FROM Users WHERE id=$1', [req.params.name], function(err, res){
            res.write("{'message':'hello," + res.rows[0].name + "'}");
            res.end();
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
    pools: {
        first : {
            user: 'postgresuser',
            password: 'postgrespwd',
            host: 'localhost',
            port: 5432,
            database: 'dbname'
        },
        second : {
            user: 'postgresuser',
            password: 'postgrespwd',
            host: 'localhost',
            port: 5435,
            database: 'otherdb'
        },
    }
    checkOnStartUp : true
}];
```

This will create 2 properties (`first` and `second`) in the `pgdb` object.
```js
module.exports = function setup(options, imports, register) {
    var db = imports.pgdb;
    // this will use second pool
    db.connection(function (err, client) {
      client.query(/*...*/);
    });
    // second pool is also available
    db.second.connection(function (err, client) {
      client.query(/*...*/);
    });
    register();
};
```
### Configuration

* `pools` object : an object with each keys containing a Pool Config. 
* `checkOnStartup` : boolean, Whether we should try to validate configuration at startup.


#### Pool config

 * `host` : serveur hostname or ip
 * `port` : serveur port
 * `user` : username to login,
 * `password` : password to login,
 * `database`: database name,
 * `application_name`: a name to identify client,
 * `validationQuery`: a query to run to validate a connection

Please refer to node pg module for details on available options.

### TypeScript

Type declarations are included and discovered automatically. The package exports
`PoolAPI`, `PgDB`, `PoolConfig`, `CustomPoolConfig`, `PoolLogger`, `ModuleOptions`,
`ModulePoolsConfig`, `ModuleImports`, `ModuleExport`, and `QueryStreamFunction`
types from its root:

```ts
import type { ModuleOptions, PgDB, PoolAPI } from 'architect-pg-pool';

const options: ModuleOptions = {
    pools: { main: { host: 'localhost', database: 'mydb' } },
    checkOnStartUp: true,
    defaultTimezoneUTC: true
};

async function getUser(db: PoolAPI, id: number) {
    const result = await db.query<{ id: number; name: string }>(
        'SELECT id, name FROM users WHERE id = $1', [id]
    );
    return result.rows[0];
}

function getMainUser(pgdb: PgDB) {
    return getUser(pgdb.main, 1);
}
```

`query` and `connection` preserve the overloads and generics provided by `pg`,
including callback and Promise forms. `queryStream(sql, params?)` returns a promise
that resolves to a Node.js `PassThrough` stream in object mode.

For contributors, `npm run test:types` regenerates the declarations from the
source JSDoc and checks TypeScript usage examples and invalid calls. Declarations
are also regenerated before packaging.

### API
The pool object has the following methods :

#### connection
Retreive a connection from the pool. The method takes a callback as parameter. Once the connection is avaliable the callback is called with an :

* `err` object if an error occured or null;
* `client` the pg client object;
* `done`, the close method.

#### query
The `query` method let you directly query the database without worrying about the database connection. Behind the scene the method retreive a connection from the pool and close it afterward. The method signature is similar to [node-pg query](https://github.com/brianc/node-postgres/wiki/Client#simple-queries).
* _string_ text: the query text;
* optional _array_ parameters: the query parameters;
* optional _function_ callback : the function called when data is ready.

Once the data is ready the callback is fired with an :

* `err` object if an error occured or null;
* `rows` the pg result set.

```js
module.exports = function setup(options, imports, register) {
    var db = imports.pgdb;
    
    db.query('SELECT * from USERS', function (err, res) {
        res.rows.forEach(console.log);
    });
    //...
};
```

#### queryStream
**Breaking change from v2.x:** `queryStream` no longer returns the stream immediately or accepts a callback. It now returns a promise that resolves to the result stream once the database connection is ready. Update existing calls to await the promise (or use `.then`) before consuming the stream. Connection-acquisition failures reject the promise; errors after the stream is created are emitted by the stream. The connection is released after the stream ends, errors, or is cancelled. The method signature is similar to [node-pg query-stream](https://github.com/brianc/node-pg-query-stream#pg-query-stream).
* _string_ text: the query text;
* optional _array_ parameters: the query parameters;
* returns: `Promise<ReadableStream>`

```js
var JSONSteam = require('JSONStream');

async function streamUsers(db) {
    var stream = await db.poolname.queryStream('SELECT * from USERS');
    stream
        .pipe(JSONSteam.stringify())
        .pipe(process.stdout);
}
```
