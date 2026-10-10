
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
  ],
});

prisma.$on("query", (event) => {
  console.log("[Prisma Query]", {
    durationMs: event.duration,
    query: event.query,
  });
});

export default prisma;
