import * as Sentry from "@sentry/node";
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { performance } from "node:perf_hooks";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import path from "path";

import prisma from "./config/prisma.js";
import typeDefs from "./graphql/typeDefs.js";
import { resolvers } from "./graphql/resolvers.js";
import rateLimiter from "./middleware/rateLimiter.js";
import { verifyAccessToken } from "./config/jwt.js";
import uploadRoutes from "./routes/upload.js";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import { fileURLToPath } from "url";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


async function startServer() {
  const app = express();



  const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];

console.log(
  "--- CORS allowed origins ---",
  corsOrigins
);


const corsOptions = {
  origin: corsOrigins,
  credentials: true,
  methods: [
    "GET",
    "HEAD",
    "PUT",
    "PATCH",
    "POST",
    "DELETE",
    "OPTIONS",
  ],
  allowedHeaders: [
    "Authorization",
    "Content-Type",
    "apollo-require-preflight",
  ],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

  app.use(express.json());
  app.use(cookieParser());
  app.use(rateLimiter);

  // ✅ static folder
  // app.use("/uploads", express.static("uploads"));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

  // ✅ REST upload
  app.use("/api", uploadRoutes);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginLandingPageLocalDefault()],
  });

  await server.start();

  // 🔥 MUST be before /graphql
app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 5 }));
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        let user = null;

        const authHeader = req.headers["authorization"];

        if (authHeader?.startsWith("Bearer ")) {
          const token = authHeader.replace("Bearer ", "");
const jwtStart = performance.now();
          try {
            const decoded = verifyAccessToken(token);
console.log(
  "[JWT] verifyAccessToken:",
  `${(performance.now() - jwtStart).toFixed(2)} ms`
);
            if (decoded?.type === "staff") {
              user = await prisma.staff.findUnique({
                where: { id: decoded.id },
                include: { role: true },
              });
            }
          } catch (err) {
            user = null;
          }
        }

        return { req, res, user, prisma };
      },
    })
  );
Sentry.setupExpressErrorHandler(app);
  const PORT = process.env.PORT ||8005;
app.get("/debug-sentry", function mainHandler(req, res) {
  // Send a log before throwing the error
  Sentry.logger.info('User triggered test error', {
    action: 'test_error_endpoint',
  });
  // Send a test metric before throwing the error
  Sentry.metrics.count('test_counter', 1);
  throw new Error("My first Sentry error!");
});
  app.listen(PORT, () => {
  });
}

startServer();