const assert = require('assert');
const PassThrough = require('stream').PassThrough;
const createAPI = require('../src/api');

function createPool(connectError, queryError) {
    let releases = 0;
    const pool = {
        connect() {
            if (connectError) {
                return Promise.reject(connectError);
            }
            return Promise.resolve({
                query() {
                    if (queryError) {
                        throw queryError;
                    }
                    const stream = new PassThrough({ objectMode: true });
                    queueMicrotask(() => stream.end({ id: 1 }));
                    return stream;
                },
                release() {
                    releases++;
                }
            });
        },
        query() {}
    };
    pool.releaseCount = () => releases;
    return pool;
}

describe('queryStream', function () {
    it('resolves with a readable stream', async function () {
        const pool = createPool();
        const stream = await createAPI(pool).queryStream('SELECT 1');
        assert.ok(stream instanceof PassThrough);
        const rows = [];
        stream.on('data', row => rows.push(row));
        await new Promise((resolve, reject) => {
            stream.once('end', resolve);
            stream.once('error', reject);
        });
        assert.deepStrictEqual(rows, [{ id: 1 }]);
        assert.strictEqual(pool.releaseCount(), 1);
    });

    it('rejects when it cannot acquire a connection', async function () {
        const error = new Error('connection failed');
        await assert.rejects(createAPI(createPool(error)).queryStream('SELECT 1'), error);
    });

    it('releases the client after the stream ends', async function () {
        const pool = createPool();
        const stream = await createAPI(pool).queryStream('SELECT 1');
        stream.resume();
        await new Promise(resolve => stream.once('end', resolve));
        assert.strictEqual(pool.releaseCount(), 1);
    });

    it('emits stream errors and releases the client', async function () {
        let releases = 0;
        const source = new PassThrough({ objectMode: true });
        const pool = {
            connect: () => Promise.resolve({
                query: () => source,
                release: () => releases++
            }),
            query() {}
        };
        const output = await createAPI(pool).queryStream('SELECT 1');
        const error = new Error('stream failed');
        const streamError = new Promise((resolve, reject) => {
            output.once('error', reject);
        });

        source.emit('error', error);
        await assert.rejects(streamError, error);
        assert.strictEqual(releases, 1);
    });

    it('releases the client if query stream creation throws', async function () {
        const pool = createPool(null, new Error('query failed'));
        await assert.rejects(createAPI(pool).queryStream('SELECT 1'), /query failed/);
        assert.strictEqual(pool.releaseCount(), 1);
    });

    it('releases the client when the stream is cancelled', async function () {
        const pool = createPool();
        const stream = await createAPI(pool).queryStream('SELECT 1');
        stream.emit('cancel');
        assert.strictEqual(pool.releaseCount(), 1);
    });
});
