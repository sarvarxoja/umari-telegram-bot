import mongoose from "mongoose";

const DB = process.env.DB;

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(DB);
    console.log(`MongoDB connected to: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
  }
};

connectDB();
