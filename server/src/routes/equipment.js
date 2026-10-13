const router = require("express").Router();
const { db } = require("../store");
const Equipment = require("../models/Equipment");
const HttpError = require("../lib/HttpError");
const ah = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
const getEquipment = async (id) => {
  const e = await Equipment.findById(id);
  if (!e) throw new HttpError(404, "Equipment not found");
  return e;
};

function clean(b) {
  const name = String(b.name || "").trim(),
    fee = Number(b.fee),
    quantity = Number(b.quantity);
  if (name.length < 2)
    throw new HttpError(400, "Add-on name must be at least 2 characters");
  if (!(fee >= 0)) throw new HttpError(400, "Fee must be 0 or more");
  if (!Number.isInteger(quantity) || quantity < 1)
    throw new HttpError(400, "Quantity must be a whole number of at least 1");
  return {
    name,
    fee,
    quantity,
    type: String(b.type || ""),
    image: String(b.image || ""),
    images: Array.isArray(b.images)
      ? b.images.filter((x) => typeof x === "string")
      : [],
  };
}
router.get(
  "/",
  ah(async (req, res) => res.json(await Equipment.find())),
);
router.post(
  "/",
  ah(async (req, res) => {
    const e = await Equipment.create(clean(req.body));
    await Equipment.syncMemory();
    res.status(201).json(e);
  }),
);
router.put(
  "/:id",
  ah(async (req, res) => {
    const e = await getEquipment(req.params.id);
    Object.assign(e, clean(req.body));
    await e.save();
    await Equipment.syncMemory();
    res.json(e);
  }),
);
router.delete(
  "/:id",
  ah(async (req, res) => {
    const e = await getEquipment(req.params.id);
    if (db.bookings.some((b) => b.equipmentIds.includes(e.id)))
      throw new HttpError(
        400,
        "This add-on is used in bookings and cannot be deleted",
      );
    await e.deleteOne();
    await Equipment.syncMemory();
    res.json({ message: "Equipment deleted" });
  }),
);
module.exports = router;
