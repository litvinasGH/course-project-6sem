const express = require('express');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const vacancyRoutes = require('./routes/vacancyRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const interviewResultRoutes = require('./routes/interviewResultRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { requestLogger } = require('./middleware/loggingMiddleware');

const app = express();
const apiRouter = express.Router();

app.use(requestLogger);
app.use(express.json());

apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/vacancies', vacancyRoutes);
apiRouter.use('/applications', applicationRoutes);
apiRouter.use('/', interviewRoutes);
apiRouter.use('/', interviewResultRoutes);

app.use('/', apiRouter);
app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
