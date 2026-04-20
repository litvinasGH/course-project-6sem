const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api')) {
    res.end('API works');
  } else {
    res.end('Backend running');
  }
});

server.listen(3000, () => {
  console.log('Server started on 3000');
});