const router = require("express").Router();
const { db } = require("../store");
const Feedback = require("../models/Feedback");
const HttpError = require("../lib/HttpError");
const ah = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get(
  "/",
  ah(async (req, res) =>
    res.json(await Feedback.find().sort({ createdAt: -1 })),
  ),
);

router.post(
  "/",
  ah(async (req, res) => {
    const b = db.bookings.find((x) => x.id === req.body.bookingId);
    if (!b) throw new HttpError(404, "Booking not found");
    if (b.status !== "completed")
      throw new HttpError(
        400,
        "You can leave feedback after the booking is completed",
      );
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      throw new HttpError(400, "Rating must be 1 to 5");
    if (await Feedback.findOne({ bookingId: b.id }))
      throw new HttpError(400, "Feedback was already sent for this booking");
    const doc = await Feedback.create({
      bookingId: b.id,
      renterId: b.renterId,
      studioId: b.studioId,
      rating,
      comment: String(req.body.comment || "")
        .trim()
        .slice(0, 500),
    });
    res.status(201).json(doc);
  }),
);

module.exports = router;
