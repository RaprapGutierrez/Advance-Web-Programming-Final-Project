const mongoose = require("mongoose");

const renterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
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

// TEMPORARY: keeps in-memory db.renters in step with MongoDB until bookings move
renterSchema.statics.syncMemory = async function () {
  const { db } = require("../store");
  db.renters = (await this.find().lean()).map((r) => ({ ...r, id: r._id }));
};
renterSchema.post("save", () => mongoose.model("Renter").syncMemory());
renterSchema.post("deleteOne", { document: true, query: false }, () =>
  mongoose.model("Renter").syncMemory(),
);

module.exports = mongoose.model("Renter", renterSchema);
