import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  chat_id: {
    type: Number,
  },

  username: {
    type: String,
    default: null,
  },

  first_name: {
    type: String,
    default: null,
  },
});

export const User = mongoose.model("Users", UserSchema);
