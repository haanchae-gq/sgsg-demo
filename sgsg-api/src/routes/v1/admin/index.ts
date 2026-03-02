import { FastifyPluginAsync } from 'fastify';
import adminReviewRoutes from './reviews/index.js';

const adminRoutes: FastifyPluginAsync = async function (fastify) {
  // 관리자 리뷰 관리 라우트
  fastify.register(adminReviewRoutes, { prefix: '/reviews' });
};

export default adminRoutes;