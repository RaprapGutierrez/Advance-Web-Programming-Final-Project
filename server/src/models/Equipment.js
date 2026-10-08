const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    name: { type: String, required: true, trim: true },
    fee: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  {
    versionKey: false,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  },
);

// TEMPORARY: keeps the in-memory db.equipment in step with MongoDB
// until bookings/pricing are moved to MongoDB too.
equipmentSchema.statics.syncMemory = async function () {
  const { db } = require("../store");
  db.equipment = (await this.find().lean()).map((e) => ({ ...e, id: e._id }));
};

module.exports = mongoose.model("Equipment", equipmentSchema);
