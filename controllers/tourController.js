const Tour = require('./../models/tourModel')
const catchAsync = require('./../utils/catchAsync')
const { deleteDoc, updateDoc, createDoc, getOne, getAll } = require('./handlerFactory')


exports.aliasTopTours = function(req, res, next) {
  req.query.limit = '5'
  req.query.sort = 'price,-ratingAverage'
  next()
}



exports.getTour = getOne(Tour, { path: "reviews" })
exports.getAllTours = getAll(Tour)
exports.createTour = createDoc(Tour)
exports.updateTour = updateDoc(Tour)
exports.deleteTour = deleteDoc(Tour)

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
