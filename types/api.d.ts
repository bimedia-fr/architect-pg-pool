declare namespace _exports {
    export { PoolAPI, QueryStreamCallback, QueryStreamFunction };
}
declare function _exports(pool: import("pg").Pool): PoolAPI;
export = _exports;
type PoolAPI = {
    /**
     * - The underlying pg pool
     */
    _pool: import("pg").Pool;
    /**
     * - Get a connection from the pool
     */
    connection: import("pg").Pool["connect"];
    /**
     * - Execute a query on the pool
     */
    query: import("pg").Pool["query"];
    /**
     * - Execute a query and return a stream
     */
    queryStream: QueryStreamFunction;
};
type QueryStreamCallback = (error: Error | undefined, stream?: PassThrough | undefined) => void;
type QueryStreamFunction = ((sql: string, params: unknown[] | undefined, callback: QueryStreamCallback) => PassThrough) & ((sql: string, params?: unknown[]) => Promise<PassThrough>);
import PassThrough_1 = require("stream");
import PassThrough = PassThrough_1.PassThrough;
//# sourceMappingURL=api.d.ts.map