const mongoose = require("mongoose");
const { STUDIO_TYPES } = require("../store");

const studioSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: STUDIO_TYPES, required: true },
    capacity: { type: Number, required: true },
    peakRate: { type: Number, required: true },
    offPeakRate: { type: Number, required: true },
    openHour: { type: Number, required: true },
    closeHour: { type: Number, required: true },
    description: { type: String, default: "" },
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

// TEMPORARY: keeps in-memory db.studios in step with MongoDB until bookings move
studioSchema.statics.syncMemory = async function () {
  const { db } = require("../store");
  db.studios = (await this.find().lean()).map((s) => ({ ...s, id: s._id }));
};
studioSchema.post("save", () => mongoose.model("Studio").syncMemory());
studioSchema.post("deleteOne", { document: true, query: false }, () =>
  mongoose.model("Studio").syncMemory(),
);

// TEMPORARY: keeps in-memory db.studios in step with MongoDB until bookings move
studioSchema.statics.syncMemory = async function () {
  const { db } = require("../store");
  db.studios = (await this.find().lean()).map((s) => ({ ...s, id: s._id }));
};
studioSchema.post("save", () => mongoose.model("Studio").syncMemory());
studioSchema.post("deleteOne", { document: true, query: false }, () =>
  mongoose.model("Studio").syncMemory(),
);

module.exports = mongoose.model("Studio", studioSchema);
