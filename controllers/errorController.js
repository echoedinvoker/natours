const AppError = require("../utils/appError")

module.exports = (err, _, res, __) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res)
  } else if (process.env.NODE_ENV === 'production') {
    
    let error = { ...err }
    if (err.name === 'CastError') error = handleCastErrorDB(error)
    if (err.name === 'MongoError') error = handleDuplicateFieldsDB(error)
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error)
    if (err.name === 'JsonWebTokenError') error = handleJWTInvalidError(error)
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError(error)

    sendErrorProd(error, res)
  }
}

function handleJWTExpiredError() {
  return new AppError('This token is expired, please login again!', 401)
}

function handleJWTInvalidError() {
  return new AppError('This token is invalid, please login again!', 401)
}

function handleValidationErrorDB(err) {
  const errors = Object.values(err.errors).map(el => el.message)
  const message = `Invalid input data. ${errors.join('. ')}`

  return new AppError(message, 400)
}

function handleDuplicateFieldsDB(err) {
  const message = `Duplicate field value: ${err.keyValue.name}. Please use another value!`
  return new AppError(message, 400)
}

function handleCastErrorDB(err) {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

function sendErrorDev(err, res) {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  })
}

function sendErrorProd(err, res) {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    })
  } else {
    // console.error('ERROR:', err)

    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    })
  }
}
