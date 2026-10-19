import setup = require('../..');
import createAPI = require('../../types/api');
import createPool = require('../../types/pool');
import { Pool, PoolClient, QueryResult } from 'pg';
import { PassThrough } from 'stream';
import { EventEmitter } from 'events';
import type {
    CustomPoolConfig, ModuleExport, ModuleImports, ModuleOptions,
    ModulePoolsConfig, PgDB, PoolAPI, PoolConfig, PoolLogger,
    QueryStreamFunction
} from '../..';

const log: ModuleImports['log'] = { getLogger: () => console };
const config: PoolConfig = {
    host: 'localhost',
    port: 5432,
    max: 2,
    ssl: { rejectUnauthorized: true },
    validationQuery: 'SELECT 1'
};
const custom: CustomPoolConfig = {
    validateAsync(connection, callback) {
        connection.query('SELECT 1').then(result => callback(result), () => callback(false));
    }
};
const pools: ModulePoolsConfig = { main: { ...config, ...custom } };
const options: ModuleOptions = { pools, defaultTimezoneUTC: true, checkOnStartUp: false };
const logger: PoolLogger = console;
const api: PoolAPI = createAPI(new Pool(config));
const created: PoolAPI = createPool('main', config, logger);
const pgdb: PgDB = { main: api, other: created };
const exported: ModuleExport = { pgdb, onDestroy() {} };
exported.onDestroy();

setup(options, { log }, (error, services) => {
    if (error) throw error;
    if (services) services.onDestroy();
});
setup(options, { log, hub: new EventEmitter() }, (error) => {
    if (error) throw error;
});
const consumes: string[] = setup.consumes;
const provides: string[] = setup.provides;
void [consumes, provides];

interface Row { id: number; name: string }
const connected: Promise<PoolClient> = api.connection();
connected.then(client => client.release());
api.connection((error, client, release) => {
    if (error) throw error;
    if (client) client.query('SELECT 1');
    release();
});
const result: Promise<QueryResult<Row>> = api.query<Row>('SELECT $1 AS id', [1]);
result.then(value => {
    const id: number = value.rows[0].id;
    // @ts-expect-error Row IDs are numbers.
    const invalid: string = value.rows[0].id;
    void [id, invalid];
});
api.query<Row>('SELECT 1 AS id', (error, value) => {
    if (error) throw error;
    const id: number = value.rows[0].id;
    void id;
});
api.query<Row>({ text: 'SELECT $1 AS id', values: [1] });
api.query<Row>('SELECT $1 AS id', [1], (error, value) => {
    if (error) throw error;
    const id: number = value.rows[0].id;
    void id;
});
const arrays: Promise<import('pg').QueryArrayResult<[number]>> =
    api.query<[number]>({ text: 'SELECT 1', rowMode: 'array' });
void arrays;

const queryStream: QueryStreamFunction = api.queryStream;
const streamPromise: Promise<PassThrough> = queryStream('SELECT 1');
const parameterizedStreamPromise: Promise<PassThrough> = queryStream('SELECT $1', [1]);
streamPromise.then(stream => stream.emit('cancel'));
void parameterizedStreamPromise;
api._pool.end();

// @ts-expect-error Pool ports must be numbers.
const invalidConfig: PoolConfig = { port: '5432' };
// @ts-expect-error A timezone flag is a boolean, not a string.
const invalidOptions: ModuleOptions = { pools, defaultTimezoneUTC: 'true' };
// @ts-expect-error A query must have a valid pg query signature.
api.query(42);
// @ts-expect-error Streaming parameters must be an array.
api.queryStream('SELECT $1', 1);
// @ts-expect-error queryStream no longer accepts a callback.
api.queryStream('SELECT 1', [], () => {});
void [invalidConfig, invalidOptions];
