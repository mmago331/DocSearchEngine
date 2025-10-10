import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import health from "@/routes/health";
import auth from "@/routes/auth";
import documents from "@/routes/documents";
// import search route as you implemented it:
import mountSearch from "@/routes/search"; // if your search exports a mount() fn
import { errorHandler, notFound } from "@/middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use("/health", health);
app.use("/auth", auth);
app.use("/documents", documents);

// If your search route exports a router instead, do: app.use("/api/search", searchRouter);
mountSearch(app);

app.use(notFound);
app.use(errorHandler);

export default app;
