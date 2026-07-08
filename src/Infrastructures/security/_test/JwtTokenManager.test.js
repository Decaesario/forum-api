import { vi } from 'vitest';
import jwt from 'jsonwebtoken';
import InvariantError from '../../../Commons/exceptions/InvariantError.js';
import '../../../Commons/config.js';
import JwtTokenManager from '../JwtTokenManager.js';

describe('JwtTokenManager', () => {
  describe('createAccessToken function', () => {
    it('should create accessToken correctly', async () => {
      // Arrange
      const spySign = vi.spyOn(jwt, 'sign');
      const jwtTokenManager = new JwtTokenManager(jwt);
      const payload = { username: 'dicoding' };

      // Action
      const accessToken = await jwtTokenManager.createAccessToken(payload);

      // Assert
      expect(typeof accessToken).toEqual('string');
      expect(spySign).toBeCalledWith(payload, process.env.ACCESS_TOKEN_KEY, { expiresIn: Number(process.env.ACCCESS_TOKEN_AGE) });
    });
  });

  describe('createRefreshToken function', () => {
    it('should create refreshToken correctly', async () => {
      // Arrange
      const spySign = vi.spyOn(jwt, 'sign');
      const jwtTokenManager = new JwtTokenManager(jwt);
      const payload = { username: 'dicoding' };

      // Action
      const refreshToken = await jwtTokenManager.createRefreshToken(payload);

      // Assert
      expect(typeof refreshToken).toEqual('string');
      expect(spySign).toBeCalledWith(payload, process.env.REFRESH_TOKEN_KEY);
    });
  });

  describe('verifyRefreshToken function', () => {
    it('should throw InvariantError when verification failed', async () => {
      // Arrange
      const jwtTokenManager = new JwtTokenManager(jwt);
      const accessToken = await jwtTokenManager.createAccessToken({ username: 'dicoding' });

      // Action & Assert
      await expect(jwtTokenManager.verifyRefreshToken(accessToken)).rejects.toThrowError(InvariantError);
    });

    it('should not throw InvariantError when refresh token verified', async () => {
      // Arrange
      const jwtTokenManager = new JwtTokenManager(jwt);
      const refreshToken = await jwtTokenManager.createRefreshToken({ username: 'dicoding' });

      // Action & Assert
      await expect(jwtTokenManager.verifyRefreshToken(refreshToken)).resolves.not.toThrowError(InvariantError);
    });
  });

  describe('decodePayload function', () => {
    it('should decode payload correctly', async () => {
      // Arrange
      const jwtTokenManager = new JwtTokenManager(jwt);
      const accessToken = await jwtTokenManager.createAccessToken({ username: 'dicoding' });

      // Action
      const { username } = await jwtTokenManager.decodePayload(accessToken);

      // Assert
      expect(username).toEqual('dicoding');
    });
  });
});