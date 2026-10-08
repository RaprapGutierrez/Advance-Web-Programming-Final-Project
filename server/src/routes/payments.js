const router = require("express").Router();
const { db, METHODS } = require("../store");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const HttpError = require("../lib/HttpError");
const { find } = require("../lib/helpers");
const B = require("../lib/bookings");
const { r2 } = require("../lib/pricing");
const ah = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const hydrate = (p) => {
  const b = db.bookings.find((x) => x.id === p.bookingId);
  return {
    ...p,
    renterName: b
      ? db.renters.find((r) => r.id === b.renterId)?.name
      : undefined,
    studioName: b
      ? db.studios.find((s) => s.id === b.studioId)?.name
      : undefined,
    bookingDate: b?.date,
  };
};
router.get("/", (req, res) =>
  res.json(
    db.payments
      .filter(
        (p) => !req.query.bookingId || p.bookingId === req.query.bookingId,
      )
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(hydrate),
  ),
);
router.post(
  "/",
  ah(async (req, res) => {
    const b = db.bookings.find((x) => x.id === req.body.bookingId);
    if (!b) throw new HttpError(400, "Choose a valid booking");
    if (!B.BILLABLE.includes(b.status))
      throw new HttpError(
        400,
        "Confirm the booking before recording a payment",
      );
    if (!METHODS.includes(req.body.method))
      throw new HttpError(400, `Method must be one of: ${METHODS.join(", ")}`);
    const amount = r2(Number(req.body.amount));
    if (!(amount > 0))
      throw new HttpError(400, "Amount must be greater than 0");
    const due = B.hydrate(b).balanceDue;
    if (amount > due)
      throw new HttpError(
        400,
        `Only ₱${due.toFixed(2)} is still due on this booking`,
      );
    const doc = await Payment.create({
      bookingId: b.id,
      amount,
      method: req.body.method,
      date: B.todayStr(),
    });
    await Payment.syncMemory();
    if (b.status === "confirmed" && B.hydrate(b).balanceDue === 0) {
      // fully paid moves the booking forward
      await Booking.updateOne({ _id: b.id }, { status: "paid" });
      await Booking.syncMemory();
    }
    res.status(201).json(hydrate(find(db.payments, doc._id, "Payment")));
  }),
);
router.delete(
  "/:id",
  ah(async (req, res) => {
    const p = find(db.payments, req.params.id, "Payment");
    await Payment.deleteOne({ _id: p.id });
    await Payment.syncMemory();
    const b = db.bookings.find((x) => x.id === p.bookingId);
    if (b && b.status === "paid" && B.hydrate(b).balanceDue > 0) {
      await Booking.updateOne({ _id: b.id }, { status: "confirmed" });
      await Booking.syncMemory();
    }
    res.json({ message: "Payment deleted" });
  }),
);
module.exports = router;
