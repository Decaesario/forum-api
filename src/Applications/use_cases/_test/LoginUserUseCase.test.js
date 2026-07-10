import { vi } from 'vitest';
import UserRepository from '../../../Domains/users/UserRepository.js';
import AuthenticationRepository from '../../../Domains/authentications/AuthenticationRepository.js';
import AuthenticationTokenManager from '../../security/AuthenticationTokenManager.js';
import PasswordHash from '../../security/PasswordHash.js';
import LoginUserUseCase from '../LoginUserUseCase.js';
import NewAuth from '../../../Domains/authentications/entities/NewAuth.js';

describe('LoginUserUseCase', () => {
  it('should throw error if use case payload not contain needed property', async () => {
    // Arrange
    const useCasePayload = {
      username: 'dicoding',
    };
    const loginUserUseCase = new LoginUserUseCase({});

    // Action & Assert
    await expect(loginUserUseCase.execute(useCasePayload))
      .rejects.toThrowError('LOGIN_USER_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error if username or password not string', async () => {
    // Arrange
    const useCasePayload = {
      username: 123,
      password: 'secret',
    };
    const loginUserUseCase = new LoginUserUseCase({});

    // Action & Assert
    await expect(loginUserUseCase.execute(useCasePayload))
      .rejects.toThrowError('LOGIN_USER_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should orchestrating the login action correctly', async () => {
    // Arrange
    const useCasePayload = {
      username: 'dicoding',
      password: 'secret',
    };
    const mockedAuthentication = new NewAuth({
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
    });

    const mockUserRepository = new UserRepository();
    const mockAuthenticationRepository = new AuthenticationRepository();
    const mockAuthenticationTokenManager = new AuthenticationTokenManager();
    const mockPasswordHash = new PasswordHash();

    mockUserRepository.getPasswordByUsername = vi.fn()
      .mockImplementation(() => Promise.resolve('encrypted_password'));
    mockPasswordHash.comparePassword = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockUserRepository.getIdByUsername = vi.fn()
      .mockImplementation(() => Promise.resolve('user-123'));
    mockAuthenticationTokenManager.createAccessToken = vi.fn()
      .mockImplementation(() => Promise.resolve(mockedAuthentication.accessToken));
    mockAuthenticationTokenManager.createRefreshToken = vi.fn()
      .mockImplementation(() => Promise.resolve(mockedAuthentication.refreshToken));
    mockAuthenticationRepository.addToken = vi.fn()
      .mockImplementation(() => Promise.resolve());

    const loginUserUseCase = new LoginUserUseCase({
      userRepository: mockUserRepository,
      authenticationRepository: mockAuthenticationRepository,
      authenticationTokenManager: mockAuthenticationTokenManager,
      passwordHash: mockPasswordHash,
    });

    // Action
    const actualAuthentication = await loginUserUseCase.execute(useCasePayload);

    // Assert
    expect(actualAuthentication).toEqual(new NewAuth({
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
    }));
    expect(mockUserRepository.getPasswordByUsername).toBeCalledWith('dicoding');
    expect(mockPasswordHash.comparePassword).toBeCalledWith('secret', 'encrypted_password');
    expect(mockUserRepository.getIdByUsername).toBeCalledWith('dicoding');
    expect(mockAuthenticationTokenManager.createAccessToken).toBeCalledWith({ username: 'dicoding', id: 'user-123' });
    expect(mockAuthenticationTokenManager.createRefreshToken).toBeCalledWith({ username: 'dicoding', id: 'user-123' });
    expect(mockAuthenticationRepository.addToken).toBeCalledWith(mockedAuthentication.refreshToken);
  });
});