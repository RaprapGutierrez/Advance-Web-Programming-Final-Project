const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    bookingId: { type: String, required: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    date: { type: String, required: true },
  },
  { versionKey: false },
);

// TEMPORARY: keeps in-memory db.payments in step with MongoDB
paymentSchema.statics.syncMemory = async function () {
  const { db } = require("../store");
  db.payments = (await this.find().lean()).map((p) => ({ ...p, id: p._id }));
};

module.exports = mongoose.model("Payment", paymentSchema);
