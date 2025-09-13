import { FastifyPluginAsync } from "fastify";
import { getAllRestaurants, getRestaurantById } from "../controllers/index.js";

export const routes: FastifyPluginAsync = async (fastify, opts) => {
  // Restaurant routes
  fastify.get("/restaurants", getAllRestaurants);
  fastify.get("/restaurants/:id", getRestaurantById);
};
