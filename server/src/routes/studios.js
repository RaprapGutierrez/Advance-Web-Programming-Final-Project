const router = require("express").Router();
const { db, STUDIO_TYPES } = require("../store");
const Studio = require("../models/Studio");
const HttpError = require("../lib/HttpError");
const { find } = require("../lib/helpers");
const { PEAK_FROM } = require("../lib/pricing");

// lets async routes send errors to your error handler
const ah = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
const getStudio = async (id) => {
  const s = await Studio.findById(id);
  if (!s) throw new HttpError(404, "Studio not found");
  return s;
};

function clean(b) {
  const name = String(b.name || "").trim();
  const n = (v) => Number(v);
  if (name.length < 2)
    throw new HttpError(400, "Studio name must be at least 2 characters");
  if (!STUDIO_TYPES.includes(b.type))
    throw new HttpError(400, `Type must be one of: ${STUDIO_TYPES.join(", ")}`);
  if (!Number.isInteger(n(b.capacity)) || n(b.capacity) < 1)
    throw new HttpError(400, "Capacity must be a whole number of at least 1");
  if (!(n(b.peakRate) >= 0) || !(n(b.offPeakRate) >= 0))
    throw new HttpError(400, "Rates must be 0 or more");
  if (
    !Number.isInteger(n(b.openHour)) ||
    !Number.isInteger(n(b.closeHour)) ||
    n(b.openHour) < 0 ||
    n(b.closeHour) > 24 ||
    n(b.closeHour) <= n(b.openHour)
  )
    throw new HttpError(400, "Closing hour must be after the opening hour");
  return {
    name,
    type: b.type,
    capacity: n(b.capacity),
    peakRate: n(b.peakRate),
    offPeakRate: n(b.offPeakRate),
    openHour: n(b.openHour),
    closeHour: n(b.closeHour),
    description: String(b.description || "")
      .trim()
      .slice(0, 200),
  };
}
router.get(
  "/",
  ah(async (req, res) => res.json(await Studio.find())),
);
router.get(
  "/:id",
  ah(async (req, res) => res.json(await getStudio(req.params.id))),
);
// Processing: hour-by-hour availability for a date
router.get(
  "/:id/availability",
  ah(async (req, res) => {
    const s = await getStudio(req.params.id);
    const date = String(req.query.date || "");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(new Date(date).getTime())
    )
      throw new HttpError(400, "A valid date query is required (YYYY-MM-DD)");
    const day = db.bookings.filter(
      (b) => b.studioId === s.id && b.date === date && b.status !== "cancelled",
    );
    const slots = [];
    for (let hour = s.openHour; hour < s.closeHour; hour++) {
      const b = day.find((x) => hour >= x.startHour && hour < x.endHour);
      const peak = hour >= PEAK_FROM;
      slots.push({
        hour,
        peak,
        rate: peak ? s.peakRate : s.offPeakRate,
        booked: !!b,
        bookingId: b?.id ?? null,
        renterName: b
          ? (db.renters.find((r) => r.id === b.renterId)?.name ?? null)
          : null,
      });
    }
    res.json({
      studioId: s.id,
      date,
      openHour: s.openHour,
      closeHour: s.closeHour,
      slots,
      freeHours: slots.filter((x) => !x.booked).length,
      bookedHours: slots.filter((x) => x.booked).length,
    });
  }),
);
router.post(
  "/",
  ah(async (req, res) => {
    res.status(201).json(await Studio.create(clean(req.body)));
  }),
);
router.put(
  "/:id",
  ah(async (req, res) => {
    const s = await getStudio(req.params.id);
    Object.assign(s, clean(req.body));
    res.json(await s.save());
  }),
);
router.delete(
  "/:id",
  ah(async (req, res) => {
    const s = await getStudio(req.params.id);
    if (db.bookings.some((b) => b.studioId === s.id))
      throw new HttpError(400, "This studio has bookings. Delete them first.");
    await s.deleteOne();
    res.json({ message: "Studio deleted" });
  }),
);
module.exports = router;
