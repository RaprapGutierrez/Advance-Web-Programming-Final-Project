const router = require("express").Router();
const { db } = require("../store");
const Renter = require("../models/Renter");
const HttpError = require("../lib/HttpError");
const ah = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
const getRenter = async (id) => {
  const r = await Renter.findById(id);
  if (!r) throw new HttpError(404, "Renter not found");
  return r;
};
const B = require("../lib/bookings");
const { r2 } = require("../lib/pricing");

function hydrate(r) {
  const mine = db.bookings.filter((b) => b.renterId === r.id).map(B.hydrate);
  const done = B.completedCount(r.id);
  const t = B.tierFor(done);
  return {
    ...(r.toJSON ? r.toJSON() : r),
    tier: t.tier,
    discountRate: t.rate,
    completedBookings: done,
    bookings: mine.length,
    balanceDue: r2(
      mine
        .filter((b) => B.BILLABLE.includes(b.status))
        .reduce((s, b) => s + b.balanceDue, 0),
    ),
  };
}
async function clean(b, id) {
  const name = String(b.name || "").trim(),
    email = String(b.email || "")
      .trim()
      .toLowerCase(),
    phone = String(b.phone || "").trim();
  if (name.length < 2)
    throw new HttpError(400, "Name must be at least 2 characters");
  if (!/^\S+@\S+\.\S+$/.test(email))
    throw new HttpError(400, "A valid email is required");
  if (phone.length < 7)
    throw new HttpError(400, "A valid phone number is required");
  const dup = await Renter.findOne({ email });
  if (dup && dup.id !== id)
    throw new HttpError(400, "Email is already registered");
  return { name, email, phone };
}
router.get(
  "/",
  ah(async (req, res) =>
    res.json((await Renter.find()).map((r) => hydrate(r))),
  ),
);
router.get(
  "/:id",
  ah(async (req, res) => res.json(hydrate(await getRenter(req.params.id)))),
);
// Processing: loyalty tier, spend and balance for one renter
router.get(
  "/:id/summary",
  ah(async (req, res) => {
    const r = hydrate(await getRenter(req.params.id));
    const mine = db.bookings
      .filter((b) => b.renterId === r.id && b.status !== "cancelled")
      .map(B.hydrate);
    res.json({
      renterId: r.id,
      tier: r.tier,
      discountRate: r.discountRate,
      totalBilled: r2(mine.reduce((s, b) => s + b.total, 0)),
      totalPaid: r2(mine.reduce((s, b) => s + b.paid, 0)),
      balanceDue: r.balanceDue,
      hoursBooked: mine.reduce((s, b) => s + b.hours, 0),
      overdueBookings: mine.filter((b) => b.overdue).length,
    });
  }),
);
router.post(
  "/",
  ah(async (req, res) => {
    const r = await Renter.create(await clean(req.body));
    res.status(201).json(hydrate(r));
  }),
);
router.put(
  "/:id",
  ah(async (req, res) => {
    const r = await getRenter(req.params.id);
    Object.assign(r, await clean(req.body, r.id));
    await r.save();
    res.json(hydrate(r));
  }),
);
router.delete(
  "/:id",
  ah(async (req, res) => {
    const r = await getRenter(req.params.id);
    if (db.bookings.some((b) => b.renterId === r.id))
      throw new HttpError(
        400,
        "This renter has bookings. Delete or cancel them first.",
      );
    await r.deleteOne();
    res.json({ message: "Renter deleted" });
  }),
);
module.exports = router;
