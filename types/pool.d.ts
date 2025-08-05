declare namespace _exports {
    export { CustomPoolConfig, PoolConfig };
}
declare function _exports(name: string, config: PoolConfig, log: import("log4js").Logger): import("./api").PoolAPI;
export = _exports;
type CustomPoolConfig = {
    /**
     * - A query to validate the connection
     */
    validationQuery?: string | undefined;
    /**
     * - A function to validate the connection asynchronously
     */
    validateAsync?: Function | undefined;
};
type PoolConfig = pg.PoolConfig & CustomPoolConfig;
import pg = require("pg");
//# sourceMappingURL=pool.d.ts.map