const express = require("express");
const cors = require("cors");
const logger = require("./middleware/logger");
const { notFound, errorHandler } = require("./middleware/errors");

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(logger);
app.use("/api/renters", require("./routes/renters"));
app.use("/api/studios", require("./routes/studios"));
app.use("/api/equipment", require("./routes/equipment"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/auth", require("./routes/auth"));
app.use(notFound);
app.use(errorHandler);
module.exports = app;
