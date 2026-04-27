const app = require('./app');
const config = require('./utils/config');

app.listen(config.port, () => {
  console.log(`Server started on ${config.port}`);
});
