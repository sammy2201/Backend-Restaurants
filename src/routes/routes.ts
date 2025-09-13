import { FastifyPluginAsync } from "fastify";
import {
  getIndex,
  getAllRestaurants,
  getRestaurantById,
} from "../controllers/index.js";

export const routes: FastifyPluginAsync = async (fastify, opts) => {
  // Root route
  fastify.get("/", getIndex);
  // Restaurant routes
  fastify.get("/restaurants", getAllRestaurants);

  fastify.get("/restaurants/:id", getRestaurantById);
};
