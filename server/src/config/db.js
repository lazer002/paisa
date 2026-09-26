import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/paisa";

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // fail fast if Mongo is down
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.error(`\n💡 Could not connect to ${uri}`);
    console.error("   Is MongoDB running? Start it and try again:");
    console.error("   - Windows service: net start MongoDB");
    console.error("   - Or: mongod --dbpath <path>");
    console.error("   - Or use Atlas: set MONGO_URI to your Atlas connection string\n");
    process.exit(1);
  }
};

export default connectDB;
