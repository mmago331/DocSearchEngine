import app from './src/app.js';
import { dbPath } from './db.js';

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`DocSearchEngine listening on ${port}`);
  console.log(`Using database at ${dbPath}`);
});
