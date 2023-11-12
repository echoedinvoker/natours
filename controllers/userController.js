const User = require("../models/userModel")
const catchAsync = require("../utils/catchAsync")

const resNotDefined = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  })
}

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find()

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  })
})

exports.deleteUser = catchAsync(async function(req, res, next) {
  const user = await User.findByIdAndDelete(req.params.id, req.body)

  if (!user) return next(new AppError(`No user found with id ${req.params.id}`, 404))

  res.status(204).json({
    status: 'success',
    data: null
  })
})

exports.updateUser = resNotDefined
exports.createUser = resNotDefined
exports.getUser = resNotDefined

