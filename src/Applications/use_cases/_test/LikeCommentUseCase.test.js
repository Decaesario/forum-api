import { vi } from 'vitest';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import CommentLikeRepository from '../../../Domains/comments/CommentLikeRepository.js';
import LikeCommentUseCase from '../LikeCommentUseCase.js';

describe('LikeCommentUseCase', () => {
  it('should orchestrating the like action correctly when comment is not liked yet', async () => {
    // Arrange
    const threadId = 'thread-123';
    const commentId = 'comment-123';
    const owner = 'user-123';

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockCommentLikeRepository = new CommentLikeRepository();

    mockThreadRepository.verifyThreadExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentLikeRepository.verifyLikeExists = vi.fn()
      .mockImplementation(() => Promise.resolve(false));
    mockCommentLikeRepository.addLike = vi.fn()
      .mockImplementation(() => Promise.resolve());

    const likeCommentUseCase = new LikeCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      commentLikeRepository: mockCommentLikeRepository,
    });

    // Action
    await likeCommentUseCase.execute(threadId, commentId, owner);

    // Assert
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(threadId);
    expect(mockCommentRepository.verifyCommentExists).toBeCalledWith(commentId);
    expect(mockCommentLikeRepository.verifyLikeExists).toBeCalledWith(commentId, owner);
    expect(mockCommentLikeRepository.addLike).toBeCalledWith(commentId, owner);
  });

  it('should orchestrating the unlike action correctly when comment is already liked', async () => {
    // Arrange
    const threadId = 'thread-123';
    const commentId = 'comment-123';
    const owner = 'user-123';

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockCommentLikeRepository = new CommentLikeRepository();

    mockThreadRepository.verifyThreadExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExists = vi.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentLikeRepository.verifyLikeExists = vi.fn()
      .mockImplementation(() => Promise.resolve(true));
    mockCommentLikeRepository.deleteLike = vi.fn()
      .mockImplementation(() => Promise.resolve());

    const likeCommentUseCase = new LikeCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      commentLikeRepository: mockCommentLikeRepository,
    });

    // Action
    await likeCommentUseCase.execute(threadId, commentId, owner);

    // Assert
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(threadId);
    expect(mockCommentRepository.verifyCommentExists).toBeCalledWith(commentId);
    expect(mockCommentLikeRepository.verifyLikeExists).toBeCalledWith(commentId, owner);
    expect(mockCommentLikeRepository.deleteLike).toBeCalledWith(commentId, owner);
  });
});