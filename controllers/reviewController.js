const Review = require("../models/reviewModel");
const { deleteDoc, updateDoc, createDoc, getOne, getAll } = require("./handlerFactory");

exports.userTourIds = (req, res, next) => {
  if (!req.body.user) req.body.user = req.user._id
  if (!req.body.tour) req.body.tour = req.params.tourId

  next()
}

exports.getReview = getOne(Review)
exports.getAllReviews = getAll(Review) 
exports.createReview = createDoc(Review)
exports.updateReview = updateDoc(Review)
exports.deleteReview = deleteDoc(Review)


