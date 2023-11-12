class AppError extends Error {
  constructor(message, statusCode) {
    super(message)

    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'

    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
    console.log('message', this.message)
    console.log('statusCode', this.statusCode)
  }
}

module.exports = AppError
