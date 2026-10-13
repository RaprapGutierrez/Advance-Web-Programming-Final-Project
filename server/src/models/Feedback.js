const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    bookingId: { type: String, required: true, unique: true },
    renterId: { type: String, required: true },
    studioId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
  },
  {
    versionKey: false,
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  },
);

module.exports = mongoose.model("Feedback", feedbackSchema);
