const router = require("express").Router();
const { db } = require("../store");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const HttpError = require("../lib/HttpError");
const { find } = require("../lib/helpers");
const B = require("../lib/bookings");
const ah = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Status flow: pending -> confirmed -> paid -> completed (cancel allowed before payment)
const FLOW = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["paid", "cancelled"],
  paid: ["completed"],
  completed: [],
  cancelled: [],
};

router.get("/", (req, res) => {
  const { date, studioId, renterId, status, overdue, hasBalance } = req.query;
  const list = db.bookings
    .map(B.hydrate)
    .filter(
      (b) =>
        (!date || b.date === date) &&
        (!studioId || b.studioId === studioId) &&
        (!renterId || b.renterId === renterId) &&
        (!status || b.status === status) &&
        (overdue !== "true" || b.overdue) &&
        (hasBalance !== "true" ||
          (B.BILLABLE.includes(b.status) && b.balanceDue > 0)),
    );
  res.json(
    list.sort(
      (a, b) => a.date.localeCompare(b.date) || a.startHour - b.startHour,
    ),
  );
});
// Processing: price preview and conflict check without saving
router.post("/quote", (req, res) => {
  const existing = req.body.bookingId
    ? db.bookings.find((b) => b.id === req.body.bookingId)
    : undefined;
  const { fields } = B.validate(req.body, existing);
  const { hours, peakHours, subtotal, addOns, discountRate, discount, total } =
    fields;
  res.json({
    hours,
    peakHours,
    offPeakHours: hours - peakHours,
    subtotal,
    addOns,
    discountRate,
    discount,
    total,
  });
});
router.get("/:id", (req, res) =>
  res.json(B.hydrate(find(db.bookings, req.params.id, "Booking"))),
);
router.post(
  "/",
  ah(async (req, res) => {
    const { fields } = B.validate(req.body);
    const doc = await Booking.create({ status: "pending", ...fields });
    await Booking.syncMemory();
    res.status(201).json(B.hydrate(find(db.bookings, doc._id, "Booking")));
  }),
);
router.put(
  "/:id",
  ah(async (req, res) => {
    const b = find(db.bookings, req.params.id, "Booking");
    if (!["pending", "confirmed"].includes(b.status))
      throw new HttpError(
        400,
        "Only pending or confirmed bookings can be edited",
      );
    const { fields } = B.validate(req.body, b);
    if (B.paidOf(b.id) > fields.total)
      throw new HttpError(400, "New total is lower than what was already paid");
    await Booking.updateOne({ _id: b.id }, { $set: fields });
    await Booking.syncMemory();
    res.json(B.hydrate(find(db.bookings, b.id, "Booking")));
  }),
);
router.patch(
  "/:id/status",
  ah(async (req, res) => {
    const b = find(db.bookings, req.params.id, "Booking");
    const next = req.body.status;
    if (!FLOW[next])
      throw new HttpError(
        400,
        "Status must be pending, confirmed, paid, completed or cancelled",
      );
    if (!FLOW[b.status].includes(next))
      throw new HttpError(400, `A ${b.status} booking cannot become ${next}`);
    const h = B.hydrate(b);
    if (next === "paid" && h.balanceDue > 0)
      throw new HttpError(
        400,
        `Record the remaining payment of ₱${h.balanceDue.toFixed(2)} first`,
      );
    if (next === "cancelled" && h.paid > 0)
      throw new HttpError(400, "Remove recorded payments before cancelling");
    await Booking.updateOne({ _id: b.id }, { status: next });
    await Booking.syncMemory();
    res.json(B.hydrate(find(db.bookings, b.id, "Booking")));
  }),
);
router.delete(
  "/:id",
  ah(async (req, res) => {
    const b = find(db.bookings, req.params.id, "Booking");
    await Booking.deleteOne({ _id: b.id });
    await Payment.deleteMany({ bookingId: b.id });
    await Booking.syncMemory();
    await Payment.syncMemory();
    res.json({ message: "Booking deleted" });
  }),
);
module.exports = router;
