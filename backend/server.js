import app from './src/app.js';

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`DocSearchEngine listening on ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
