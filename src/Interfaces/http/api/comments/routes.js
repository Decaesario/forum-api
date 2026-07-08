import express from 'express';
import authenticate from '../../../../Infrastructures/http/middlewares/authenticate.js';

const routes = (controller) => {
  const router = express.Router({ mergeParams: true });

  router.post('/', authenticate, controller.postComment);
  router.delete('/:commentId', authenticate, controller.deleteComment);

  return router;
};

export default routes;