const ClientError = require('./client-error');

class UnprocessableEntityError extends ClientError {
  constructor(message) {
    super(message, 422);
    this.name = 'UnprocessableEntityError';
  }
}

module.exports = UnprocessableEntityError;
