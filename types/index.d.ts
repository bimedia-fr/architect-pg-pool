declare namespace _exports {
    export { ModulePoolsConfig, ModuleOptions, ModuleExport, ModuleImports };
}
declare function _exports(options: ModuleOptions, imports: ModuleImports, register: (arg0: Error | null, arg1: ModuleExport | null) => void): void | Promise<void>;
declare namespace _exports {
    let consumes: string[];
    let provides: string[];
}
export = _exports;
type ModulePoolsConfig = {
    [x: string]: createPool.PoolConfig;
};
type ModuleOptions = {
    /**
     * - If set, the default timezone will be UTC
     */
    defaultTimezoneUTC?: string | undefined;
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
    db: {
        [x: string]: import("./api").PoolAPI;
    };
    onDestroy: Function;
};
type ModuleImports = {
    hub: import("node:stream").EventEmitter;
    log: import("architect-log4js").Log4jsWithRequest;
};
import createPool = require("./pool");
//# sourceMappingURL=index.d.ts.map