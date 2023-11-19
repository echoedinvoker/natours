const express = require('express')
const { getAllTours, createTour, getTour, updateTour, deleteTour, aliasTopTours, getTourStats, getMonthlyPlan } = require('./../controllers/tourController')
const { protect, restrictTo } = require('../controllers/authController')
const reviewRouter = require('./reviewRoutes')
const router = express.Router()

router.use('/:tourId/reviews', reviewRouter)

router.route('/top-5-cheap').get(aliasTopTours, getAllTours)
router.route('/tour-stats').get(getTourStats)
router.route('/').get(getAllTours)
router.route('/:id').get(getTour)

router.use(protect)

router.route('/tours-within/:distance/center/:latlng/unit/:unit')

// /tours-within/400/center/0.14325,3.21345/unit/mi

router.route('/monthly-plan/:year').get(
  restrictTo('admin', 'lead-guide', 'guide'),
  getMonthlyPlan
)

router.use(restrictTo('admin', 'lead-guide'))

router.route('/').post(createTour)
router.route('/:id').patch(updateTour).delete(deleteTour)


module.exports = router

