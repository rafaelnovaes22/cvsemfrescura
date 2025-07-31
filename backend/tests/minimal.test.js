// Teste mínimo sem dependências externas
describe('Minimal Test Suite', () => {
    test('should pass basic math test', () => {
        expect(1 + 1).toBe(2);
    });

    test('should pass string test', () => {
        expect('hello').toBe('hello');
    });

    test('should pass array test', () => {
        const arr = [1, 2, 3];
        expect(arr.length).toBe(3);
        expect(arr[0]).toBe(1);
    });

    test('should pass object test', () => {
        const obj = { name: 'test', value: 42 };
        expect(obj.name).toBe('test');
        expect(obj.value).toBe(42);
    });

    test('should pass async test', async () => {
        const promise = Promise.resolve('success');
        const result = await promise;
        expect(result).toBe('success');
    });
});