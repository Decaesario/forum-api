import { vi } from 'vitest';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ReplyRepository from '../../../Domains/replies/ReplyRepository.js';
import CommentLikeRepository from '../../../Domains/comments/CommentLikeRepository.js';
import GetThreadUseCase from '../GetThreadUseCase.js';

describe('GetThreadUseCase', () => {
  const threadId = 'thread-123';
  const mockThread = {
    id: 'thread-123',
    title: 'sebuah thread',
    body: 'sebuah body thread',
    date: '2021-08-08T07:19:09.775Z',
    username: 'dicoding',
  };

  const createUseCase = ({ comments, repliesMap, likeCountMap }) => {
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();
    const mockCommentLikeRepository = new CommentLikeRepository();

    mockThreadRepository.getThreadById = vi.fn()
      .mockImplementation(() => Promise.resolve({ ...mockThread }));
    mockCommentRepository.getCommentsByThreadId = vi.fn()
      .mockImplementation(() => Promise.resolve(comments.map((comment) => ({ ...comment }))));
    mockReplyRepository.getRepliesByCommentId = vi.fn()
      .mockImplementation((commentId) => Promise.resolve(
        (repliesMap[commentId] || []).map((reply) => ({ ...reply })),
      ));
    mockCommentLikeRepository.getLikeCountByCommentId = vi.fn()
      .mockImplementation((commentId) => Promise.resolve(likeCountMap[commentId] ?? 0));

    return {
      getThreadUseCase: new GetThreadUseCase({
        threadRepository: mockThreadRepository,
        commentRepository: mockCommentRepository,
        replyRepository: mockReplyRepository,
        commentLikeRepository: mockCommentLikeRepository,
      }),
      mockThreadRepository,
      mockCommentRepository,
      mockReplyRepository,
      mockCommentLikeRepository,
    };
  };

  it('should orchestrate fetching thread, comments, replies, and like counts correctly', async () => {
    // Arrange
    const comments = [
      {
        id: 'comment-123', username: 'johndoe', date: '2021-08-08T07:22:33.555Z', content: 'sebuah comment', is_delete: false,
      },
    ];
    const {
      getThreadUseCase, mockThreadRepository, mockCommentRepository, mockReplyRepository, mockCommentLikeRepository,
    } = createUseCase({
      comments,
      repliesMap: { 'comment-123': [] },
      likeCountMap: { 'comment-123': 0 },
    });

    // Action
    await getThreadUseCase.execute(threadId);

    // Assert
    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(threadId);
    expect(mockReplyRepository.getRepliesByCommentId).toBeCalledWith('comment-123');
    expect(mockCommentLikeRepository.getLikeCountByCommentId).toBeCalledWith('comment-123');
  });

  it('should return thread detail with correct properties', async () => {
    // Arrange
    const { getThreadUseCase } = createUseCase({
      comments: [],
      repliesMap: {},
      likeCountMap: {},
    });

    // Action
    const thread = await getThreadUseCase.execute(threadId);

    // Assert
    expect(thread.id).toEqual(mockThread.id);
    expect(thread.title).toEqual(mockThread.title);
    expect(thread.body).toEqual(mockThread.body);
    expect(thread.date).toEqual(mockThread.date);
    expect(thread.username).toEqual(mockThread.username);
  });

  it('should display deleted comment content as "**komentar telah dihapus**"', async () => {
    // Arrange
    const comments = [
      {
        id: 'comment-456', username: 'dicoding', date: '2021-08-08T07:26:21.338Z', content: 'comment yang dihapus', is_delete: true,
      },
    ];
    const { getThreadUseCase } = createUseCase({
      comments,
      repliesMap: { 'comment-456': [] },
      likeCountMap: { 'comment-456': 0 },
    });

    // Action
    const thread = await getThreadUseCase.execute(threadId);

    // Assert
    expect(thread.comments[0].content).toEqual('**komentar telah dihapus**');
  });

  it('should display non-deleted comment content as is', async () => {
    // Arrange
    const comments = [
      {
        id: 'comment-123', username: 'johndoe', date: '2021-08-08T07:22:33.555Z', content: 'sebuah comment', is_delete: false,
      },
    ];
    const { getThreadUseCase } = createUseCase({
      comments,
      repliesMap: { 'comment-123': [] },
      likeCountMap: { 'comment-123': 0 },
    });

    // Action
    const thread = await getThreadUseCase.execute(threadId);

    // Assert
    expect(thread.comments[0].content).toEqual('sebuah comment');
  });

  it('should display deleted reply content as "**balasan telah dihapus**"', async () => {
    // Arrange
    const comments = [
      {
        id: 'comment-123', username: 'johndoe', date: '2021-08-08T07:22:33.555Z', content: 'sebuah comment', is_delete: false,
      },
    ];
    const repliesMap = {
      'comment-123': [
        {
          id: 'reply-222', username: 'dicoding', date: '2021-08-08T07:59:48.766Z', content: 'balasan yang dihapus', is_delete: true,
        },
      ],
    };
    const { getThreadUseCase } = createUseCase({
      comments,
      repliesMap,
      likeCountMap: { 'comment-123': 0 },
    });

    // Action
    const thread = await getThreadUseCase.execute(threadId);

    // Assert
    expect(thread.comments[0].replies[0].content).toEqual('**balasan telah dihapus**');
  });

  it('should display non-deleted reply content as is', async () => {
    // Arrange
    const comments = [
      {
        id: 'comment-123', username: 'johndoe', date: '2021-08-08T07:22:33.555Z', content: 'sebuah comment', is_delete: false,
      },
    ];
    const repliesMap = {
      'comment-123': [
        {
          id: 'reply-111', username: 'johndoe', date: '2021-08-08T08:07:01.522Z', content: 'sebuah balasan', is_delete: false,
        },
      ],
    };
    const { getThreadUseCase } = createUseCase({
      comments,
      repliesMap,
      likeCountMap: { 'comment-123': 0 },
    });

    // Action
    const thread = await getThreadUseCase.execute(threadId);

    // Assert
    expect(thread.comments[0].replies[0].content).toEqual('sebuah balasan');
  });

  it('should return correct like count for each comment', async () => {
    // Arrange
    const comments = [
      {
        id: 'comment-123', username: 'johndoe', date: '2021-08-08T07:22:33.555Z', content: 'sebuah comment', is_delete: false,
      },
      {
        id: 'comment-456', username: 'dicoding', date: '2021-08-08T07:26:21.338Z', content: 'comment lain', is_delete: false,
      },
    ];
    const { getThreadUseCase } = createUseCase({
      comments,
      repliesMap: { 'comment-123': [], 'comment-456': [] },
      likeCountMap: { 'comment-123': 2, 'comment-456': 0 },
    });

    // Action
    const thread = await getThreadUseCase.execute(threadId);

    // Assert
    expect(thread.comments[0].likeCount).toEqual(2);
    expect(thread.comments[1].likeCount).toEqual(0);
  });
});