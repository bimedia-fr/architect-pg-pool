const assert = require('assert');
const PassThrough = require('stream').PassThrough;
const createAPI = require('../src/api');

function createPool(connectError) {
    return {
        connect(callback) {
            if (connectError) {
                queueMicrotask(() => callback(connectError));
                return;
            }
            queueMicrotask(() => callback(null, {
                query() {
                    const stream = new PassThrough({ objectMode: true });
                    queueMicrotask(() => stream.end({ id: 1 }));
                    return stream;
                }
            }, () => {}));
        },
        query() {}
    };
}

describe('queryStream', function () {
    it('resolves with a stream when no callback is provided', async function () {
        const stream = await createAPI(createPool()).queryStream('SELECT 1');
        assert.ok(stream instanceof PassThrough);
        const rows = [];
        stream.on('data', row => rows.push(row));
        await new Promise((resolve, reject) => {
            stream.once('end', resolve);
            stream.once('error', reject);
        });
        assert.deepStrictEqual(rows, [{ id: 1 }]);
    });

    it('rejects when it cannot acquire a connection', async function () {
        const error = new Error('connection failed');
        await assert.rejects(createAPI(createPool(error)).queryStream('SELECT 1'), error);
    });

    it('preserves the stream return value and callback behavior', function (done) {
        const api = createAPI(createPool());
        const returned = api.queryStream('SELECT 1', undefined, (error, stream) => {
            assert.ifError(error);
            assert.strictEqual(stream, returned);
            done();
        });
        assert.ok(returned instanceof PassThrough);
    });
});
