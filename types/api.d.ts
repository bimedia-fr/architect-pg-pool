declare namespace _exports {
    export { PoolAPI };
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
    connection: Function;
    /**
     * - Execute a query on the pool
     */
    query: Function;
    /**
     * - Execute a query and return a stream
     */
    queryStream: Function;
};
//# sourceMappingURL=api.d.ts.map