import { vi } from 'vitest';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ReplyRepository from '../../../Domains/replies/ReplyRepository.js';
import CommentLikeRepository from '../../../Domains/comments/CommentLikeRepository.js';
import GetThreadUseCase from '../GetThreadUseCase.js';

describe('GetThreadUseCase', () => {
  it('should orchestrating the get thread detail action correctly', async () => {
    // Arrange
    const threadId = 'thread-123';
    const mockThread = {
      id: 'thread-123',
      title: 'sebuah thread',
      body: 'sebuah body thread',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };
    const mockComments = [
      {
        id: 'comment-123',
        username: 'johndoe',
        date: '2021-08-08T07:22:33.555Z',
        content: 'sebuah comment',
        is_delete: false,
      },
      {
        id: 'comment-456',
        username: 'dicoding',
        date: '2021-08-08T07:26:21.338Z',
        content: 'comment yang dihapus',
        is_delete: true,
      },
    ];
    const mockRepliesComment123 = [
      {
        id: 'reply-111',
        username: 'johndoe',
        date: '2021-08-08T08:07:01.522Z',
        content: 'sebuah balasan',
        is_delete: false,
      },
    ];
    const mockRepliesComment456 = [
      {
        id: 'reply-222',
        username: 'dicoding',
        date: '2021-08-08T07:59:48.766Z',
        content: 'balasan yang dihapus',
        is_delete: true,
      },
    ];

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();
    const mockCommentLikeRepository = new CommentLikeRepository();

    mockThreadRepository.getThreadById = vi.fn()
      .mockImplementation(() => Promise.resolve({ ...mockThread }));
    mockCommentRepository.getCommentsByThreadId = vi.fn()
      .mockImplementation(() => Promise.resolve(mockComments.map((comment) => ({ ...comment }))));
    mockReplyRepository.getRepliesByCommentId = vi.fn()
      .mockImplementation((commentId) => {
        if (commentId === 'comment-123') {
          return Promise.resolve(mockRepliesComment123.map((reply) => ({ ...reply })));
        }
        return Promise.resolve(mockRepliesComment456.map((reply) => ({ ...reply })));
      });
    mockCommentLikeRepository.getLikeCountByCommentId = vi.fn()
      .mockImplementation((commentId) => {
        if (commentId === 'comment-123') {
          return Promise.resolve(2);
        }
        return Promise.resolve(0);
      });

    const getThreadUseCase = new GetThreadUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
      commentLikeRepository: mockCommentLikeRepository,
    });

    // Action
    const thread = await getThreadUseCase.execute(threadId);

    // Assert
    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(threadId);
    expect(mockReplyRepository.getRepliesByCommentId).toBeCalledWith('comment-123');
    expect(mockReplyRepository.getRepliesByCommentId).toBeCalledWith('comment-456');
    expect(mockCommentLikeRepository.getLikeCountByCommentId).toBeCalledWith('comment-123');
    expect(mockCommentLikeRepository.getLikeCountByCommentId).toBeCalledWith('comment-456');

    expect(thread.id).toEqual('thread-123');
    expect(thread.comments).toHaveLength(2);

    expect(thread.comments[0].content).toEqual('sebuah comment');
    expect(thread.comments[0].likeCount).toEqual(2);
    expect(thread.comments[0].replies).toHaveLength(1);

    expect(thread.comments[1].content).toEqual('**komentar telah dihapus**');
    expect(thread.comments[1].likeCount).toEqual(0);
    expect(thread.comments[1].replies).toHaveLength(1);
  });
});