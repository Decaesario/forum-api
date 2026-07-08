import LikeCommentUseCase from '../../../../Applications/use_cases/LikeCommentUseCase.js';

class LikesController {
  constructor(container) {
    this._container = container;

    this.putLike = this.putLike.bind(this);
  }

  async putLike(req, res, next) {
    try {
      const { id: owner } = req.auth.credentials;
      const { threadId, commentId } = req.params;
      const likeCommentUseCase = this._container.getInstance(LikeCommentUseCase.name);
      await likeCommentUseCase.execute(threadId, commentId, owner);

      res.status(200).json({
        status: 'success',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default LikesController;