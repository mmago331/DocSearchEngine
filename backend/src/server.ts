import app from "./app";
import { env } from "./lib/env";

const port = Number(env.PORT);

app.listen(port, () => {
  console.log(`[server] listening on :${port}`);
});
