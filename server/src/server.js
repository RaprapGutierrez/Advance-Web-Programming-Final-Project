require("dotenv").config();
const app = require("./app");
const connectDB = require("./db");

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    await require("./seed")();
    app.listen(PORT, () =>
      console.log(`StudioSpace API running on http://localhost:${PORT}`),
    );
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
