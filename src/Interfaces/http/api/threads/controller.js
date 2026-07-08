import AddThreadUseCase from '../../../../Applications/use_cases/AddThreadUseCase.js';
import GetThreadUseCase from '../../../../Applications/use_cases/GetThreadUseCase.js';

class ThreadsController {
  constructor(container) {
    this._container = container;

    this.postThread = this.postThread.bind(this);
    this.getThread = this.getThread.bind(this);
  }

  async postThread(req, res, next) {
    try {
      const { id: owner } = req.auth.credentials;
      const addThreadUseCase = this._container.getInstance(AddThreadUseCase.name);
      const addedThread = await addThreadUseCase.execute(owner, req.body);

      res.status(201).json({
        status: 'success',
        data: {
          addedThread,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getThread(req, res, next) {
    try {
      const { threadId } = req.params;
      const getThreadUseCase = this._container.getInstance(GetThreadUseCase.name);
      const thread = await getThreadUseCase.execute(threadId);

      res.status(200).json({
        status: 'success',
        data: {
          thread,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ThreadsController;