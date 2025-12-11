const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://freshmart-frontend-nu.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/products", require("./routes/products"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "FreshMart API is running" });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/freshmart"
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.error("\n📋 To fix this issue:");
    console.error("1. Make sure MongoDB is running (check MongoDB Compass)");
    console.error("2. Verify MONGODB_URI in .env file is correct");
    console.error("3. Default: mongodb://localhost:27017/freshmart");
    console.error(
      "\n⚠️  Server will continue but database operations will fail until MongoDB is connected.\n"
    );
  }
};

connectDB();

// Handle MongoDB connection events
mongoose.connection.on("disconnected", () => {
  console.log("⚠️  MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected");
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});

// Handle port already in use error
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error("💡 To fix this:");
    console.error(`   1. Find the process: netstat -ano | findstr :${PORT}`);
    console.error("   2. Kill the process: taskkill /PID <PID> /F");
    console.error("   3. Or change the PORT in .env file");
    process.exit(1);
  } else {
    console.error("❌ Server error:", error);
    process.exit(1);
  }
});
