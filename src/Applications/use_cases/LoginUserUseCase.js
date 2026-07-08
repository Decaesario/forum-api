import NewAuth from '../../Domains/authentications/entities/NewAuth.js';

class LoginUserUseCase {
  constructor({
    userRepository, authenticationRepository, authenticationTokenManager, passwordHash,
  }) {
    this._userRepository = userRepository;
    this._authenticationRepository = authenticationRepository;
    this._authenticationTokenManager = authenticationTokenManager;
    this._passwordHash = passwordHash;
  }

  async execute(useCasePayload) {
    this._verifyPayload(useCasePayload);
    const { username, password } = useCasePayload;

    const encryptedPassword = await this._userRepository.getPasswordByUsername(username);
    await this._passwordHash.comparePassword(password, encryptedPassword);

    const id = await this._userRepository.getIdByUsername(username);

    const accessToken = await this._authenticationTokenManager.createAccessToken({ username, id });
    const refreshToken = await this._authenticationTokenManager.createRefreshToken({ username, id });

    const newAuthentication = new NewAuth({
      accessToken,
      refreshToken,
    });

    await this._authenticationRepository.addToken(newAuthentication.refreshToken);

    return newAuthentication;
  }

  _verifyPayload(payload) {
    const { username, password } = payload;

    if (!username || !password) {
      throw new Error('LOGIN_USER_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof username !== 'string' || typeof password !== 'string') {
      throw new Error('LOGIN_USER_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

export default LoginUserUseCase;