const http = require('http');
const pool = require('./db');

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/api/test') {
      const result = await pool.query('SELECT NOW()');
      res.end(result.rows[0].now.toString());
    }

    else if (req.url === '/api/users') {
      const result = await pool.query('SELECT * FROM users');
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result.rows));
    }

    else {
      res.end('API is work');
    }
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end('500 Server Error');
  }
});

server.listen(3000, () => {
  console.log('Server started on 3000');
});
