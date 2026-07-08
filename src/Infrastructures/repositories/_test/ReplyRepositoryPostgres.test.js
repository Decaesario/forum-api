import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import AuthorizationError from '../../../Commons/exceptions/AuthorizationError.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import NewReply from '../../../Domains/replies/entities/NewReply.js';
import AddedReply from '../../../Domains/replies/entities/AddedReply.js';
import pool from '../../database/postgres/pool.js';
import ReplyRepositoryPostgres from '../ReplyRepositoryPostgres.js';

describe('ReplyRepositoryPostgres', () => {
  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addReply function', () => {
    it('should persist new reply and return added reply correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-reply-test-1' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-reply-test-1' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-reply-test-1', threadId: 'thread-123' });
      const newReply = new NewReply({ content: 'sebuah balasan' });
      const fakeIdGenerator = () => '123';
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedReply = await replyRepositoryPostgres.addReply('comment-123', 'user-reply-test-1', newReply);

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById('reply-123');
      expect(replies).toHaveLength(1);
      expect(addedReply).toStrictEqual(new AddedReply({
        id: 'reply-123',
        content: 'sebuah balasan',
        owner: 'user-reply-test-1',
      }));
    });
  });

  describe('verifyReplyExists function', () => {
    it('should throw NotFoundError when reply not found', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyExists('reply-123'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when reply found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-reply-test-2' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-reply-test-2' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-reply-test-2', threadId: 'thread-123' });
      await RepliesTableTestHelper.addReply({ id: 'reply-123', owner: 'user-reply-test-2', commentId: 'comment-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyExists('reply-123'))
        .resolves.not.toThrowError(NotFoundError);
    });
  });

  describe('verifyReplyOwner function', () => {
    it('should throw AuthorizationError when user is not the owner', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-reply-test-3' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-reply-test-3' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-reply-test-3', threadId: 'thread-123' });
      await RepliesTableTestHelper.addReply({ id: 'reply-123', owner: 'user-reply-test-3', commentId: 'comment-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-lain'))
        .rejects.toThrowError(AuthorizationError);
    });

    it('should not throw AuthorizationError when user is the owner', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-reply-test-4' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-reply-test-4' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-reply-test-4', threadId: 'thread-123' });
      await RepliesTableTestHelper.addReply({ id: 'reply-123', owner: 'user-reply-test-4', commentId: 'comment-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-reply-test-4'))
        .resolves.not.toThrowError(AuthorizationError);
    });
  });

  describe('deleteReply function', () => {
    it('should soft delete reply correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-reply-test-5' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-reply-test-5' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-reply-test-5', threadId: 'thread-123' });
      await RepliesTableTestHelper.addReply({ id: 'reply-123', owner: 'user-reply-test-5', commentId: 'comment-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action
      await replyRepositoryPostgres.deleteReply('reply-123');

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById('reply-123');
      expect(replies[0].is_delete).toEqual(true);
    });
  });

  describe('getRepliesByCommentId function', () => {
    it('should return replies correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-reply-test-6', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-reply-test-6' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-reply-test-6', threadId: 'thread-123' });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123', owner: 'user-reply-test-6', commentId: 'comment-123', date: '2021-08-08T07:59:48.766Z',
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByCommentId('comment-123');

      // Assert
      expect(replies).toHaveLength(1);
      expect(replies[0].id).toEqual('reply-123');
      expect(replies[0].username).toEqual('dicoding');
      expect(replies[0].date).toEqual('2021-08-08T07:59:48.766Z');
      expect(replies[0].content).toEqual('sebuah balasan');
      expect(replies[0].is_delete).toEqual(false);
    });
  });
});