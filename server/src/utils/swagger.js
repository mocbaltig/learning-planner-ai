const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Learning App',
      version: '0.2.0',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Development' }],
    tags: [
      { name: 'Auth', description: 'Authentication & profile' },
      { name: 'Goals', description: 'Goal management' },
      { name: 'Tasks', description: 'Task management' },
      { name: 'AI', description: 'AI-powered planning' },
      { name: 'Progress', description: 'Progress tracking' },
      { name: 'Health', description: 'Server health' },
      { name: 'Metrics', description: 'Observability' },
    ],
  },
  apis: [
    './src/routes/*.js',
    './src/app.js',
    './src/middleware/authenticate.js',
    './src/middleware/errorHandler.js',
  ],
};

const openapiSpecification = swaggerJsdoc(options);

module.exports = { openapiSpecification };
