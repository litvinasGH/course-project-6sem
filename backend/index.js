const http = require('http');
const prisma = require('./db');

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/api/test') {
      const result = await prisma.$queryRaw`SELECT NOW() AS now`;
      res.end(result[0].now.toString());
    }

    else if (req.url === '/api/users') {
      const users = await prisma.user.findMany({
        include: {
          roles: true,
          profile: true,
        },
      });

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(users));
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
