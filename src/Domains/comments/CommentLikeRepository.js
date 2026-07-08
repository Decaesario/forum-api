class CommentLikeRepository {
  async verifyLikeExists(commentId, owner) {
    throw new Error('COMMENT_LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  }

  async addLike(commentId, owner) {
    throw new Error('COMMENT_LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  }

  async deleteLike(commentId, owner) {
    throw new Error('COMMENT_LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  }

  async getLikeCountByCommentId(commentId) {
    throw new Error('COMMENT_LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  }
}

export default CommentLikeRepository;