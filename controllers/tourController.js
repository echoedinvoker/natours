const APIFeatures = require('../utils/APIFeatures')
const AppError = require('../utils/appError')
const Tour = require('./../models/tourModel')
const catchAsync = require('./../utils/catchAsync')


exports.aliasTopTours = function(req, res, next) {
  req.query.limit = '5'
  req.query.sort = 'price,-ratingAverage'
  next()
}

exports.getAllTours = catchAsync(async function(req, res) {
  const query = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate().query
  const tours = await query

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours
    }
  })
})

exports.getTour = catchAsync(async function(req, res, next) {
  const tour = await Tour.findById(req.params.id)

  if (!tour) return next(new AppError(`No tour found with id ${req.params.id}`, 404))

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  })
})

exports.createTour = catchAsync(async function(req, res) {
  const newTour = await Tour.create(req.body)

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  })
})

exports.updateTour = catchAsync(async function(req, res, next) {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })

  if (!tour) return next(new AppError(`No tour found with id ${req.params.id}`, 404))

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  })
})

exports.deleteTour = catchAsync(async function(req, res, next) {
  const tour = await Tour.findByIdAndDelete(req.params.id, req.body)

  if (!tour) return next(new AppError(`No tour found with id ${req.params.id}`, 404))

  res.status(204).json({
    status: 'success',
    data: null
  })
})

exports.getTourStats = catchAsync(async function(_, res) {
  const stats = await Tour.aggregate([
    { $match: { ratingAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingQuantity' },
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      }
    },
  ])

  res.status(200).json({
    status: 'success',
    results: stats.length,
    data: {
      stats
    }
  })
})

exports.getMonthlyPlan = catchAsync(async function(req, res) {
  const year = req.params.year
  const plan = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    { $addFields: { month: '$_id' } },
    { $project: { _id: 0 } },
    { $sort: { numTourStarts: -1 } },
    { $limit: 3 }
  ])


  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan
    }
  })

})
