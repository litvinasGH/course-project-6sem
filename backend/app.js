const express = require('express');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const vacancyRoutes = require('./routes/vacancyRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/vacancies', vacancyRoutes);
app.use('/applications', applicationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
