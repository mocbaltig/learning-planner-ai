const ClientError = require('./client-error');

class UnauthorizedError extends ClientError {
  constructor(message) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

module.exports = UnauthorizedError;
