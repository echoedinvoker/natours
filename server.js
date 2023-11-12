const dotenv = require('dotenv')
dotenv.config({
  path: `${__dirname}/config.env`
})

process.on('uncaughtException', err => {
  console.log(`ERROR: ${err}`)

  process.exit(1)
})

const app = require('./app')
const mongoose = require('mongoose')

const DB = process.env.DATABASE.replace( '<PASSWORD>', process.env.DATABASE_PASSWORD)

mongoose.connect(
  DB,
  {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => { console.log('DB connection successful!') })

const port = process.env.PORT || 3000

const server = app.listen(port, () => {
  console.log(`App is running on port ${port}...`)
})

process.on('unhandledRejection', err => {
  console.log(`ERROR: ${err}`)

  server.close(() => {
    process.exit(1)
  })
})

