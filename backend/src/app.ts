import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import health from "@/routes/health";
import auth from "@/routes/auth";
import documents from "@/routes/documents";
import { errorHandler, notFound } from "@/middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use("/health", health);
app.use("/auth", auth);
app.use("/documents", documents);

// 404 + error handler
app.use(notFound);
app.use(errorHandler);

export default app;
