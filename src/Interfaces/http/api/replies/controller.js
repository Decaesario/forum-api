import AddReplyUseCase from '../../../../Applications/use_cases/AddReplyUseCase.js';
import DeleteReplyUseCase from '../../../../Applications/use_cases/DeleteReplyUseCase.js';

class RepliesController {
  constructor(container) {
    this._container = container;

    this.postReply = this.postReply.bind(this);
    this.deleteReply = this.deleteReply.bind(this);
  }

  async postReply(req, res, next) {
    try {
      const { id: owner } = req.auth.credentials;
      const { threadId, commentId } = req.params;
      const addReplyUseCase = this._container.getInstance(AddReplyUseCase.name);
      const addedReply = await addReplyUseCase.execute(threadId, commentId, owner, req.body);

      res.status(201).json({
        status: 'success',
        data: {
          addedReply,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReply(req, res, next) {
    try {
      const { id: owner } = req.auth.credentials;
      const { threadId, commentId, replyId } = req.params;
      const deleteReplyUseCase = this._container.getInstance(DeleteReplyUseCase.name);
      await deleteReplyUseCase.execute(threadId, commentId, replyId, owner);

      res.status(200).json({
        status: 'success',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default RepliesController;