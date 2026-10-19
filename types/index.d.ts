declare namespace _exports {
    export { PoolAPI, QueryStreamFunction, PoolConfig, CustomPoolConfig, PoolLogger, PgDB, ModulePoolsConfig, ModuleOptions, ModuleExport, ModuleImports };
}
declare function _exports(options: ModuleOptions, imports: ModuleImports, register: (arg0: Error | null, arg1: ModuleExport | null) => void): void | Promise<void>;
declare namespace _exports {
    let consumes: string[];
    let provides: string[];
}
export = _exports;
type PoolAPI = import("./api").PoolAPI;
type QueryStreamFunction = import("./api").QueryStreamFunction;
type PoolConfig = import("./pool").PoolConfig;
type CustomPoolConfig = import("./pool").CustomPoolConfig;
type PoolLogger = import("./pool").PoolLogger;
type PgDB = {
    [x: string]: import("./api").PoolAPI;
};
type ModulePoolsConfig = {
    [x: string]: createPool.PoolConfig;
};
type ModuleOptions = {
    /**
     * - If set, the default timezone will be UTC
     */
    defaultTimezoneUTC?: boolean | undefined;
    /**
     * - If true, check the connection to the database on startup
     */
    checkOnStartUp?: boolean | undefined;
    /**
     * - Configuration for the database pools
     */
    pools: ModulePoolsConfig;
};
type ModuleExport = {
    pgdb: PgDB;
    onDestroy: () => void;
};
type ModuleImports = {
    hub?: EventEmitter<Record<string | symbol, unknown[]>> | undefined;
    log: {
        getLogger: (category: string) => Pick<Console, "debug" | "info" | "error">;
    };
};
import createPool = require("./pool");
import type { EventEmitter } from 'node:events';
//# sourceMappingURL=index.d.ts.map