import CommentLikesTableTestHelper from '../../../../tests/CommentLikesTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import pool from '../../database/postgres/pool.js';
import CommentLikeRepositoryPostgres from '../CommentLikeRepositoryPostgres.js';

describe('CommentLikeRepositoryPostgres', () => {
  afterEach(async () => {
    await CommentLikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('verifyLikeExists function', () => {
    it('should return false when like not found', async () => {
      // Arrange
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      // Action
      const result = await commentLikeRepositoryPostgres.verifyLikeExists('comment-123', 'user-123');

      // Assert
      expect(result).toEqual(false);
    });

    it('should return true when like found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-like-test-1' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-like-test-1' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-like-test-1', threadId: 'thread-123' });
      await CommentLikesTableTestHelper.addLike({ id: 'like-123', commentId: 'comment-123', owner: 'user-like-test-1' });
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      // Action
      const result = await commentLikeRepositoryPostgres.verifyLikeExists('comment-123', 'user-like-test-1');

      // Assert
      expect(result).toEqual(true);
    });
  });

  describe('addLike function', () => {
    it('should persist like correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-like-test-2' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-like-test-2' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-like-test-2', threadId: 'thread-123' });
      const fakeIdGenerator = () => '123';
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await commentLikeRepositoryPostgres.addLike('comment-123', 'user-like-test-2');

      // Assert
      const likes = await CommentLikesTableTestHelper.findLike('comment-123', 'user-like-test-2');
      expect(likes).toHaveLength(1);
    });
  });

  describe('deleteLike function', () => {
    it('should delete like correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-like-test-3' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-like-test-3' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-like-test-3', threadId: 'thread-123' });
      await CommentLikesTableTestHelper.addLike({ id: 'like-123', commentId: 'comment-123', owner: 'user-like-test-3' });
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      // Action
      await commentLikeRepositoryPostgres.deleteLike('comment-123', 'user-like-test-3');

      // Assert
      const likes = await CommentLikesTableTestHelper.findLike('comment-123', 'user-like-test-3');
      expect(likes).toHaveLength(0);
    });
  });

  describe('getLikeCountByCommentId function', () => {
    it('should return correct like count', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-like-test-4', username: 'dicoding' });
      await UsersTableTestHelper.addUser({ id: 'user-like-test-5', username: 'johndoe' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-like-test-4' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-like-test-4', threadId: 'thread-123' });
      await CommentLikesTableTestHelper.addLike({ id: 'like-1', commentId: 'comment-123', owner: 'user-like-test-4' });
      await CommentLikesTableTestHelper.addLike({ id: 'like-2', commentId: 'comment-123', owner: 'user-like-test-5' });
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      // Action
      const count = await commentLikeRepositoryPostgres.getLikeCountByCommentId('comment-123');

      // Assert
      expect(count).toEqual(2);
    });

    it('should return 0 when no likes found', async () => {
      // Arrange
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      // Action
      const count = await commentLikeRepositoryPostgres.getLikeCountByCommentId('comment-123');

      // Assert
      expect(count).toEqual(0);
    });
  });
});