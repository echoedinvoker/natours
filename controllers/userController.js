const User = require("../models/userModel")
const AppError = require("../utils/appError")
const catchAsync = require("../utils/catchAsync")
const { deleteDoc, updateDoc, getOne, getAll } = require("./handlerFactory")

const resNotDefined = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  })
}



exports.deleteMe = catchAsync(async function(req, res, next) {
  await User.findByIdAndUpdate(req.user._id, { active: false })

  res.status(204).json({
    status: 'success',
    data: null
  })
})

exports.updateMe = catchAsync(async function(req, res, next) {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route shouldn't allow password updates - use /updateMyPassword instead.", 400))
  }
  
  // 2) Update user document
  const updateData = filterObj(req.body, 'name', 'email')
  const user = await req.user.updateOne(updateData, { new: true, runValidators: true })

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  })
})

exports.getUser = getOne(User)
exports.getAllUsers = getAll(User)
exports.updateUser = updateDoc(User)
exports.deleteUser = deleteDoc(User)
exports.createUser = resNotDefined

function filterObj(obj, ...allowedFields) {
  const copyObj = { ...obj }
  let updateData = {}
  Object.keys(copyObj).forEach(el => {
    if (allowedFields.includes(el)) updateData[el] = copyObj[el]
  })

  return updateData
}
