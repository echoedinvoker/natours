const APIFeatures = require("../utils/APIFeatures")
const AppError = require("../utils/appError")
const catchAsync = require("../utils/catchAsync")



exports.getAll = Model => catchAsync(async function(req, res) {

  let filter = {}
  if (req.params.tourId) filter = { tour: req.params.tourId }

  const query = new APIFeatures(Model.find(filter), req.query)
    .filter().sort().limitFields().paginate().query
  const docs = await query

  res.status(200).json({
    status: 'success',
    results: docs.length,
    data: {
      data: docs
    }
  })
})

exports.getOne = (Model, populateOption) => catchAsync(async function(req, res, next) {

  const query = Model.findById(req.params.id)
  if (populateOption) query.populate(populateOption)
  const doc = await query

  if (!doc) return next(new AppError(`No document found with id ${req.params.id}`, 404))

  res.status(200).json({
    status: 'success',
    data: {
      data: doc
    }
  })
})

exports.deleteDoc = Model => catchAsync(async function(req, res, next) {
  const doc = await Model.findByIdAndDelete(req.params.id, req.body)

  if (!doc) return next(new AppError(`No document found with id ${req.params.id}`, 404))

  res.status(204).json({
    status: 'success',
    data: null
  })
})

exports.updateDoc = Model => catchAsync(async function(req, res, next) {
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })

  if (!doc) return next(new AppError(`No document found with id ${req.params.id}`, 404))

  res.status(200).json({
    status: 'success',
    data: {
      data: doc
    }
  })
})

exports.createDoc = Model => catchAsync(async function(req, res) {
  const newDoc = await Model.create(req.body)

  res.status(201).json({
    status: 'success',
    data: {
      data: newDoc
    }
  })
})
