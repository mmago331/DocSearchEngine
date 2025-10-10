import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import health from "@/routes/health";
import auth from "@/routes/auth";
import documents from "@/routes/documents";
import mountSearch from "@/routes/search";
import { errorHandler, notFound } from "@/middleware/errorHandler";

export default function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  app.use("/health", health);
  app.use("/auth", auth);
  app.use("/documents", documents);
  mountSearch(app);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
