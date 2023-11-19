const express = require('express')
const { getAllUsers, createUser, getUser, updateUser, deleteUser, updateMe, deleteMe } = require('./../controllers/userController')
const { signup, login, forgotPassword, resetPassword, protect, updateMyPassword, getMe, restrictTo } = require('../controllers/authController')


const router = express.Router()

router.post('/signup', signup)
router.post('/login', login)
router.post('/forgotPassword', forgotPassword)
router.post('/resetPassword/:token', resetPassword)

router.use(protect)

router.patch('/updateMyPassword', updateMyPassword)
router.patch('/updateMe', updateMe)
router.delete('/deleteMe', deleteMe)
router.get('/me', getMe, getUser)

router.use(restrictTo('admin'))

router.route('/')
  .get(getAllUsers)
  .post(createUser)

router.route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser)

module.exports = router

