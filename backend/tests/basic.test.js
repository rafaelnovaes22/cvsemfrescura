// Teste básico para verificar se Jest está funcionando
describe('Basic Test', () => {
  it('deve passar', () => {
    expect(1 + 1).toBe(2);
  });

  it('deve verificar strings', () => {
    expect('hello').toBe('hello');
  });
});