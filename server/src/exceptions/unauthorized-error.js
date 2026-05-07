const ClientError = require('./client-error');

class UnauthorizedError extends ClientError {
  constructor(message = 'Autentikasi diperlukan') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

module.exports = UnauthorizedError;
