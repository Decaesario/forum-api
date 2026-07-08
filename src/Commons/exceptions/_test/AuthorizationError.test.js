import AuthorizationError from '../AuthorizationError.js';
import ClientError from '../ClientError.js';

describe('AuthorizationError', () => {
  it('should create AuthorizationError correctly', () => {
    const authorizationError = new AuthorizationError('resource yang Anda minta dilarang untuk diakses');

    expect(authorizationError).toBeInstanceOf(ClientError);
    expect(authorizationError.statusCode).toEqual(403);
    expect(authorizationError.message).toEqual('resource yang Anda minta dilarang untuk diakses');
    expect(authorizationError.name).toEqual('AuthorizationError');
  });
});