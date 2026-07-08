import express from 'express';
import authenticate from '../../../../Infrastructures/http/middlewares/authenticate.js';

const routes = (controller) => {
  const router = express.Router({ mergeParams: true });

  router.post('/', authenticate, controller.postReply);
  router.delete('/:replyId', authenticate, controller.deleteReply);

  return router;
};

export default routes;