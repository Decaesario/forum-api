import PasswordHash from '../PasswordHash.js';

describe('PasswordHash interface', () => {
  it('should throw error when invoke unimplemented method', async () => {
    // Arrange
    const passwordHash = new PasswordHash();

    // Action & Assert
    await expect(passwordHash.hash('dummy_password')).rejects.toThrowError('PASSWORD_HASH.METHOD_NOT_IMPLEMENTED');
    await expect(passwordHash.comparePassword('plain', 'encrypted')).rejects.toThrowError('PASSWORD_HASH.METHOD_NOT_IMPLEMENTED');
  });
});