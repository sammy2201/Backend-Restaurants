import "dotenv/config";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import { routes } from "./routes/routes.js";

const fastify = Fastify({ logger: true });

await fastify.register(fastifyCors, { origin: "*" });
// Register routes plugin
fastify.register(routes);

// Health heck
fastify.get("/health", async (_request, _reply) => {
  return { status: "OK" };
});

const PORT: number = Number(process.env.PORT) || 3000;

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT });
    console.log(`Server running at http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
