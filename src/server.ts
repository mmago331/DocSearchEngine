import { createServer } from "node:http";
import app from "./app.js";

const port = Number(process.env.PORT || 4000);

createServer(app).listen(port, () => {
  console.log(`[DocSearchEngine] http://localhost:${port}`);
});
