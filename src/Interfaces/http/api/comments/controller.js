import AddCommentUseCase from '../../../../Applications/use_cases/AddCommentUseCase.js';
import DeleteCommentUseCase from '../../../../Applications/use_cases/DeleteCommentUseCase.js';

class CommentsController {
  constructor(container) {
    this._container = container;

    this.postComment = this.postComment.bind(this);
    this.deleteComment = this.deleteComment.bind(this);
  }

  async postComment(req, res, next) {
    try {
      const { id: owner } = req.auth.credentials;
      const { threadId } = req.params;
      const addCommentUseCase = this._container.getInstance(AddCommentUseCase.name);
      const addedComment = await addCommentUseCase.execute(threadId, owner, req.body);

      res.status(201).json({
        status: 'success',
        data: {
          addedComment,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req, res, next) {
    try {
      const { id: owner } = req.auth.credentials;
      const { threadId, commentId } = req.params;
      const deleteCommentUseCase = this._container.getInstance(DeleteCommentUseCase.name);
      await deleteCommentUseCase.execute(threadId, commentId, owner);

      res.status(200).json({
        status: 'success',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CommentsController;