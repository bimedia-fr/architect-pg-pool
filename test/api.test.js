var assert = require('assert');
var PassThrough = require('stream').PassThrough;
var createAPI = require('../src/api');

function createPool(connectError, omitHandle) {
    return {
        connect: function (callback) {
            setImmediate(function () {
                if (connectError) {
                    callback(connectError);
                    return;
                }
                if (omitHandle) {
                    callback(null, null, function () {});
                    return;
                }
                callback(null, {
                    query: function () {
                        var stream = new PassThrough({ objectMode: true });
                        setImmediate(function () {
                            stream.end({ id: 1 });
                        });
                        return stream;
                    }
                }, function () {});
            });
        },
        query: function () {}
    };
}

describe('queryStream', function () {
    it('resolves with a stream when no callback is provided', function () {
        return createAPI(createPool()).queryStream('SELECT 1').then(function (stream) {
            assert.ok(stream instanceof PassThrough);
            var rows = [];
            stream.on('data', function (row) {
                rows.push(row);
            });
            return new Promise(function (resolve, reject) {
                stream.once('end', function () {
                    assert.deepStrictEqual(rows, [{ id: 1 }]);
                    resolve();
                });
                stream.once('error', reject);
            });
        });
    });

    it('rejects when it cannot acquire a connection', function () {
        var error = new Error('connection failed');
        return assert.rejects(createAPI(createPool(error)).queryStream('SELECT 1'), error);
    });

    it('rejects when connection acquisition returns no client', function () {
        return assert.rejects(
            createAPI(createPool(null, true)).queryStream('SELECT 1'),
            /Unable to get a connection/
        );
    });

    it('preserves the callback API and immediate stream return', function () {
        var api = createAPI(createPool());
        var returned;
        returned = api.queryStream('SELECT 1', undefined, function (error, stream) {
            assert.ifError(error);
            assert.strictEqual(stream, returned);
        });
        assert.ok(returned instanceof PassThrough);
        return new Promise(function (resolve, reject) {
            returned.on('data', function () {});
            returned.once('end', resolve);
            returned.once('error', reject);
        });
    });
});
