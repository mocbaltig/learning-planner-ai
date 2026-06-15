const ClientError = require('./client-error');

class ServiceUnavailableError extends ClientError {
  constructor(message) {
    super(message, 503);
    this.name = 'ServiceUnavailableError';
  }
}

module.exports = ServiceUnavailableError;
