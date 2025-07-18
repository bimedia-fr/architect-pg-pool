const logger = {};
'error warn info debug'.split(' ').map((method) => logger[method] = () => { });
module.exports = {
    getLogger: () => {
        return logger;
    }
};
