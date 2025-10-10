import http from "http";
import app from "./app";

const port = Number(process.env.PORT) || 4000;

http.createServer(app).listen(port, () => {
  console.log(`[backend] listening on :${port}`);
});
