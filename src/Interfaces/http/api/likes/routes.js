import express from 'express';
import authenticate from '../../../../Infrastructures/http/middlewares/authenticate.js';

const routes = (controller) => {
  const router = express.Router({ mergeParams: true });

  router.put('/', authenticate, controller.putLike);

  return router;
};

export default routes;