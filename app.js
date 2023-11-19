const express = require('express')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoutes')
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
const hpp = require('hpp')

const app = express()

app.use(helmet())

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'))

const limiter = rateLimit({
  limit: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
})

app.use('/api', limiter)
app.use(express.json({ limit: '10kb' }))

app.use(mongoSanitize())
app.use(xss())

app.use(hpp({
  whitelist: ['name', 'duration', 'maxGroupSize', 'difficulty', 'price', 'priceDiscount', 'ratingAverage', 'ratingQuantity']
}))

app.use(express.static(`${__dirname}/public`))

app.use((req, _, next) => {
  req.requestTime = new Date().toISOString()
  next()
})

app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)

app.all('*', (req, _, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

app.use(globalErrorHandler)

module.exports = app

