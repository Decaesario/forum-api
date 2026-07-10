import request from 'supertest';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import CommentLikesTableTestHelper from '../../../../tests/CommentLikesTableTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';

const registerAndLoginUser = async (server, { username = 'dicoding', password = 'secret', fullname = 'Dicoding Indonesia' } = {}) => {
  await request(server).post('/users').send({ username, password, fullname });
  const loginResponse = await request(server).post('/authentications').send({ username, password });
  const { accessToken } = loginResponse.body.data;
  return accessToken;
};

describe('HTTP server', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await CommentLikesTableTestHelper.cleanTable();
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  it('should response 404 when request unregistered route', async () => {
    const server = await createServer({});
    const response = await request(server).get('/unregisteredRoute');
    expect(response.status).toEqual(404);
  });

  describe('when GET /', () => {
    it('should return 200 and hello world', async () => {
      const server = await createServer({});
      const response = await request(server).get('/');
      expect(response.status).toEqual(200);
      expect(response.body.data).toEqual('Hello world!');
    });
  });

  describe('when POST /users', () => {
    it('should response 201 and persisted user', async () => {
      const requestPayload = { username: 'dicoding', password: 'secret', fullname: 'Dicoding Indonesia' };
      const server = await createServer(container);
      const response = await request(server).post('/users').send(requestPayload);
      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedUser).toBeDefined();
    });

    it('should response 400 when request payload not contain needed property', async () => {
      const requestPayload = { fullname: 'Dicoding Indonesia', password: 'secret' };
      const server = await createServer(container);
      const response = await request(server).post('/users').send(requestPayload);
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 400 when username unavailable', async () => {
      await UsersTableTestHelper.addUser({ username: 'dicoding' });
      const requestPayload = { username: 'dicoding', fullname: 'Dicoding Indonesia', password: 'super_secret' };
      const server = await createServer(container);
      const response = await request(server).post('/users').send(requestPayload);
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('username tidak tersedia');
    });
  });

  it('should handle server error correctly', async () => {
    const requestPayload = { username: 'dicoding', fullname: 'Dicoding Indonesia', password: 'super_secret' };
    const server = await createServer({});
    const response = await request(server).post('/users').send(requestPayload);
    expect(response.status).toEqual(500);
    expect(response.body.status).toEqual('error');
    expect(response.body.message).toEqual('terjadi kegagalan pada server kami');
  });

  describe('when POST /authentications', () => {
    it('should response 201 and new authentication', async () => {
      const server = await createServer(container);
      await request(server).post('/users').send({ username: 'dicoding', password: 'secret', fullname: 'Dicoding Indonesia' });

      const response = await request(server).post('/authentications').send({ username: 'dicoding', password: 'secret' });

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should response 400 when username not found', async () => {
      const server = await createServer(container);
      const response = await request(server).post('/authentications').send({ username: 'dicoding', password: 'secret' });
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 400 when payload not contain needed property', async () => {
      const server = await createServer(container);
      const response = await request(server).post('/authentications').send({ username: 'dicoding' });
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when PUT /authentications', () => {
    it('should response 200 and new access token', async () => {
      const server = await createServer(container);
      await request(server).post('/users').send({ username: 'dicoding', password: 'secret', fullname: 'Dicoding Indonesia' });
      const loginResponse = await request(server).post('/authentications').send({ username: 'dicoding', password: 'secret' });
      const { refreshToken } = loginResponse.body.data;

      const response = await request(server).put('/authentications').send({ refreshToken });

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should response 400 when refresh token invalid', async () => {
      const server = await createServer(container);
      const response = await request(server).put('/authentications').send({ refreshToken: 'invalid_refresh_token' });
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 400 when payload not contain refresh token', async () => {
      const server = await createServer(container);
      const response = await request(server).put('/authentications').send({});
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when DELETE /authentications', () => {
    it('should response 200 when refresh token valid', async () => {
      const server = await createServer(container);
      await request(server).post('/users').send({ username: 'dicoding', password: 'secret', fullname: 'Dicoding Indonesia' });
      const loginResponse = await request(server).post('/authentications').send({ username: 'dicoding', password: 'secret' });
      const { refreshToken } = loginResponse.body.data;

      const response = await request(server).delete('/authentications').send({ refreshToken });

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
    });

    it('should response 400 when refresh token not registered', async () => {
      const server = await createServer(container);
      const response = await request(server).delete('/authentications').send({ refreshToken: 'invalid_refresh_token' });
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 400 when payload not contain refresh token', async () => {
      const server = await createServer(container);
      const response = await request(server).delete('/authentications').send({});
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when POST /threads', () => {
    it('should response 201 and persisted thread', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);

      const response = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedThread).toBeDefined();
    });

    it('should response 401 when request without authentication', async () => {
      const server = await createServer(container);
      const response = await request(server).post('/threads').send({ title: 'sebuah thread', body: 'sebuah body thread' });
      expect(response.status).toEqual(401);
    });

    it('should response 401 when access token is invalid', async () => {
      const server = await createServer(container);
      const response = await request(server)
        .post('/threads')
        .set('Authorization', 'Bearer invalid_access_token')
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      expect(response.status).toEqual(401);
    });

    it('should response 400 when payload not contain needed property', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);

      const response = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread' });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when GET /threads/{threadId}', () => {
    it('should response 200 and thread detail', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);

      const threadResponse = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const { id: threadId } = threadResponse.body.data.addedThread;

      const response = await request(server).get(`/threads/${threadId}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.thread).toBeDefined();
      expect(response.body.data.thread.comments).toBeDefined();
    });

    it('should response 404 when thread not found', async () => {
      const server = await createServer(container);
      const response = await request(server).get('/threads/thread-xxx');
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when POST /threads/{threadId}/comments', () => {
    it('should response 201 and persisted comment', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);
      const threadResponse = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const { id: threadId } = threadResponse.body.data.addedThread;

      const response = await request(server)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedComment).toBeDefined();
    });

    it('should response 401 when request without authentication', async () => {
      const server = await createServer(container);
      const response = await request(server).post('/threads/thread-xxx/comments').send({ content: 'sebuah comment' });
      expect(response.status).toEqual(401);
    });

    it('should response 404 when thread not found', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);

      const response = await request(server)
        .post('/threads/thread-xxx/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 400 when payload not contain needed property', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);
      const threadResponse = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const { id: threadId } = threadResponse.body.data.addedThread;

      const response = await request(server)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
    it('should response 200 when comment deleted correctly', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);
      const threadResponse = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const { id: threadId } = threadResponse.body.data.addedThread;

      const commentResponse = await request(server)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });
      const { id: commentId } = commentResponse.body.data.addedComment;

      const response = await request(server)
        .delete(`/threads/${threadId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
    });

    it('should response 403 when not the comment owner', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server, { username: 'dicoding' });
      const threadResponse = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const { id: threadId } = threadResponse.body.data.addedThread;

      const commentResponse = await request(server)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });
      const { id: commentId } = commentResponse.body.data.addedComment;

      const otherAccessToken = await registerAndLoginUser(server, { username: 'johndoe' });

      const response = await request(server)
        .delete(`/threads/${threadId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`);

      expect(response.status).toEqual(403);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 404 when comment not found', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);
      const threadResponse = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const { id: threadId } = threadResponse.body.data.addedThread;

      const response = await request(server)
        .delete(`/threads/${threadId}/comments/comment-xxx`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when POST /threads/{threadId}/comments/{commentId}/replies', () => {
    it('should response 201 and persisted reply', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);
      const threadResponse = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const { id: threadId } = threadResponse.body.data.addedThread;
      const commentResponse = await request(server)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });
      const { id: commentId } = commentResponse.body.data.addedComment;

      const response = await request(server)
        .post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedReply).toBeDefined();
    });

    it('should response 404 when comment not found', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);
      const threadResponse = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const { id: threadId } = threadResponse.body.data.addedThread;

      const response = await request(server)
        .post(`/threads/${threadId}/comments/comment-xxx/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 400 when payload not contain needed property', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);
      const threadResponse = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const { id: threadId } = threadResponse.body.data.addedThread;
      const commentResponse = await request(server)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });
      const { id: commentId } = commentResponse.body.data.addedComment;

      const response = await request(server)
        .post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}', () => {
    it('should response 200 when reply deleted correctly', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);
      const threadResponse = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const { id: threadId } = threadResponse.body.data.addedThread;
      const commentResponse = await request(server)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });
      const { id: commentId } = commentResponse.body.data.addedComment;
      const replyResponse = await request(server)
        .post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });
      const { id: replyId } = replyResponse.body.data.addedReply;

      const response = await request(server)
        .delete(`/threads/${threadId}/comments/${commentId}/replies/${replyId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
    });

    it('should response 403 when not the reply owner', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server, { username: 'dicoding' });
      const threadResponse = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const { id: threadId } = threadResponse.body.data.addedThread;
      const commentResponse = await request(server)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });
      const { id: commentId } = commentResponse.body.data.addedComment;
      const replyResponse = await request(server)
        .post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });
      const { id: replyId } = replyResponse.body.data.addedReply;

      const otherAccessToken = await registerAndLoginUser(server, { username: 'johndoe' });

      const response = await request(server)
        .delete(`/threads/${threadId}/comments/${commentId}/replies/${replyId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`);

      expect(response.status).toEqual(403);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 404 when reply not found', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);
      const threadResponse = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const { id: threadId } = threadResponse.body.data.addedThread;
      const commentResponse = await request(server)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });
      const { id: commentId } = commentResponse.body.data.addedComment;

      const response = await request(server)
        .delete(`/threads/${threadId}/comments/${commentId}/replies/reply-xxx`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when PUT /threads/{threadId}/comments/{commentId}/likes', () => {
    it('should response 200 when like comment for the first time', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);
      const threadResponse = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const { id: threadId } = threadResponse.body.data.addedThread;
      const commentResponse = await request(server)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });
      const { id: commentId } = commentResponse.body.data.addedComment;

      const response = await request(server)
        .put(`/threads/${threadId}/comments/${commentId}/likes`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
    });

    it('should response 200 when unlike a previously liked comment', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);
      const threadResponse = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const { id: threadId } = threadResponse.body.data.addedThread;
      const commentResponse = await request(server)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });
      const { id: commentId } = commentResponse.body.data.addedComment;

      await request(server)
        .put(`/threads/${threadId}/comments/${commentId}/likes`)
        .set('Authorization', `Bearer ${accessToken}`);

      const response = await request(server)
        .put(`/threads/${threadId}/comments/${commentId}/likes`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
    });

    it('should response 401 when request without authentication', async () => {
      const server = await createServer(container);
      const response = await request(server).put('/threads/thread-xxx/comments/comment-xxx/likes');
      expect(response.status).toEqual(401);
    });

    it('should response 404 when comment not found', async () => {
      const server = await createServer(container);
      const accessToken = await registerAndLoginUser(server);
      const threadResponse = await request(server)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });
      const { id: threadId } = threadResponse.body.data.addedThread;

      const response = await request(server)
        .put(`/threads/${threadId}/comments/comment-xxx/likes`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
    });
  });
});