const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    trim: true,
    maxLength: [40, 'A tour name must have less or equal then 40 characters'],
    minLength: [10, 'A tour name must have more or equal then 10 characters'],
    validate: [
      (val) => validator.isAlphanumeric(val, 'en-US', { ignore: / /g }),
      'Tour name must only contain characters and numbers'
    ]
  },
  slug: String,
  secret: {
    type: Boolean,
    default: false
  },
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size']
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty'],
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty is either: easy, medium or difficult'
    }
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function(val) {
        return val < this.price
      },
      message: 'Discount price ({VALUE}) should creater than price'
    }
  },
  ratingAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be bellow 5.0'],
  },
  ratingQuantity: {
    type: Number,
    default: 0
  },
  summary: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a description']
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image']
  },
  images: [String],
  startDates: [Date],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

tourSchema.virtual('durationWeeks').get(function() { return this.duration / 7 })

tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true })
  next()
})

tourSchema.pre(/^find/, function(next) {
  this.find({ secret: { $ne: true } })
  this.startTime = Date.now()

  next()
})

tourSchema.post(/^find/, function(docs, next) {
  console.log(`This query spend ${Date.now() - this.startTime} milliseconds`)

  next()
})

tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secret: { $ne: true } } })

  console.log(this.pipeline())

  next()
})

const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour

