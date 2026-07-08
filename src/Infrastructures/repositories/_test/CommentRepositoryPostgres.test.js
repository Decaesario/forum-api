import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import AuthorizationError from '../../../Commons/exceptions/AuthorizationError.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import NewComment from '../../../Domains/comments/entities/NewComment.js';
import AddedComment from '../../../Domains/comments/entities/AddedComment.js';
import pool from '../../database/postgres/pool.js';
import CommentRepositoryPostgres from '../CommentRepositoryPostgres.js';

describe('CommentRepositoryPostgres', () => {
  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addComment function', () => {
    it('should persist new comment and return added comment correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-comment-test-1' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-comment-test-1' });
      const newComment = new NewComment({ content: 'sebuah comment' });
      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedComment = await commentRepositoryPostgres.addComment('thread-123', 'user-comment-test-1', newComment);

      // Assert
      const comments = await CommentsTableTestHelper.findCommentsById('comment-123');
      expect(comments).toHaveLength(1);
      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: 'sebuah comment',
        owner: 'user-comment-test-1',
      }));
    });
  });

  describe('verifyCommentExists function', () => {
    it('should throw NotFoundError when comment not found', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyCommentExists('comment-123'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when comment found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-comment-test-2' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-comment-test-2' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-comment-test-2', threadId: 'thread-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyCommentExists('comment-123'))
        .resolves.not.toThrowError(NotFoundError);
    });
  });

  describe('verifyCommentOwner function', () => {
    it('should throw AuthorizationError when user is not the owner', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-comment-test-3' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-comment-test-3' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-comment-test-3', threadId: 'thread-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-123', 'user-lain'))
        .rejects.toThrowError(AuthorizationError);
    });

    it('should not throw AuthorizationError when user is the owner', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-comment-test-4' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-comment-test-4' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-comment-test-4', threadId: 'thread-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-123', 'user-comment-test-4'))
        .resolves.not.toThrowError(AuthorizationError);
    });
  });

  describe('deleteComment function', () => {
    it('should soft delete comment correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-comment-test-5' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-comment-test-5' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-comment-test-5', threadId: 'thread-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      await commentRepositoryPostgres.deleteComment('comment-123');

      // Assert
      const comments = await CommentsTableTestHelper.findCommentsById('comment-123');
      expect(comments[0].is_delete).toEqual(true);
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should return comments correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-comment-test-6', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-comment-test-6' });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123', owner: 'user-comment-test-6', threadId: 'thread-123', date: '2021-08-08T07:22:33.555Z',
      });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId('thread-123');

      // Assert
      expect(comments).toHaveLength(1);
      expect(comments[0].id).toEqual('comment-123');
      expect(comments[0].username).toEqual('dicoding');
      expect(comments[0].date).toEqual('2021-08-08T07:22:33.555Z');
      expect(comments[0].content).toEqual('sebuah comment');
      expect(comments[0].is_delete).toEqual(false);
    });
  });
});