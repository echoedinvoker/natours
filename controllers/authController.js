const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const User = require("../models/userModel")
const catchAsync = require("../utils/catchAsync")
const AppError = require('../utils/appError')
const sendEmail = require('../utils/email')



exports.signup = catchAsync(async (req, res, next) => {

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role // for dev, should not be in prod
  })
  createSendToken(newUser, 201, res)
})

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400))
  }
  const user = await User.findOne({ email }).select('+password')
  if (!user || !await user.correctPassword(password, user.password)) {
    return next(new AppError('Incorrect email or password', 401))
  }
  createSendToken(user, 200, res)
})

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return next(new AppError('There is no user with email address.', 404))
  }

  // 2) Generate the random reset token
  const resetToken = await user.createPasswordResetToken()

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
  const message = `Forget your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\nIf you didn't forget your password, please ignore this email!`

  try {
    await sendEmail({
      email: 'client123@gmail.com',
      subject: 'Your password reset token (valid for 10 min)',
      message
    })
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
      token: resetToken // only for postman testing on dev mode, prod mode should be removed
    })
  } catch (err) {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })

    return next(new AppError('There was an error sending the email. Try again later!', 500))
  }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  })

  if (!user) {
    return next(new AppError('Token is invalid or expired', 400))
  }
  // 2) If token is not expired, and there is user, set the new password
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined

  await user.save()

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, res)
})

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bear')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401))
  }

  // 2) Verification token
  const decoded = jwt.verify(token, process.env.JWT_SECRET)

  // 3) Check if user still exists
  const freshUser = await User.findById(decoded.id)
  if (!freshUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401))
  }

  // 4) Check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please log in again.', 401))
  }

  req.user = freshUser

  next()
})

exports.restrictTo = (...roles) => {
  return (req, _, next) => {
    console.log('roles', roles)
    console.log('user-role', req.user.role)
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You have no permission to do this action.', 403))
    }

    next()
  }
}

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
}

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection

  // 2) Check if POSTed current password is correct
  const user = await User.findById(req.user._id).select('password')
  const isPasswordCorrect = await user.correctPassword(req.body.password, user.password)
  if (!isPasswordCorrect) {
    return next(new AppError('Password is not correct!', 400))
  }

  // 3) If so, update password
  await user.updatePassword(req.body.newPassword, req.body.passwordConfirm)
  
  // 4) Log user in, send JWT
  createSendToken(req.user, 200, res)
})

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id

  next()
}

function createSendToken(user, statusCode, res) {
  const token = signToken(user._id)

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  }

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true

  res.cookie('jwt', token, cookieOptions)

  user.password = undefined
  
  res.status(statusCode).json({
    status: 'success',
    token,
    user
  })
}
