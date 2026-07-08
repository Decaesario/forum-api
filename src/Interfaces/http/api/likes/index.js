import routes from './routes.js';
import LikesController from './controller.js';

const likes = (container) => {
  const likesController = new LikesController(container);

  return routes(likesController);
};

export default likes;