declare namespace _exports {
    export { CustomPoolConfig, PoolConfig, PoolLogger };
}
declare function _exports(name: string, config: PoolConfig, log: PoolLogger): import("./api").PoolAPI;
export = _exports;
type CustomPoolConfig = {
    /**
     * - A query to validate the connection
     */
    validationQuery?: string | undefined;
    /**
     * - A function to validate the connection asynchronously
     */
    validateAsync?: ((connection: pg.PoolClient, callback: (result: false | pg.QueryResult) => void) => void) | undefined;
};
type PoolConfig = pg.PoolConfig & CustomPoolConfig;
type PoolLogger = Pick<Console, "error">;
import pg = require("pg");
//# sourceMappingURL=pool.d.ts.map