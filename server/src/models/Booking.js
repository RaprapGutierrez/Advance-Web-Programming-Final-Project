const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    renterId: { type: String, required: true },
    studioId: { type: String, required: true },
    date: { type: String, required: true },
    startHour: { type: Number, required: true },
    endHour: { type: Number, required: true },
    guests: { type: Number, default: 1 },
    equipmentIds: { type: [String], default: [] },
    status: { type: String, default: "pending" },
    discountRate: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  // strict:false keeps the other price fields (hours, subtotal, addOns, discount...)
  { strict: false, versionKey: false },
);

// TEMPORARY: keeps in-memory db.bookings in step with MongoDB
bookingSchema.statics.syncMemory = async function () {
  const { db } = require("../store");
  db.bookings = (await this.find().lean()).map((b) => ({ ...b, id: b._id }));
};

module.exports = mongoose.model("Booking", bookingSchema);
