import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  googleId: string;
  email: string;
  name: string;
  picture: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true },
    email:    { type: String, required: true },
    name:     { type: String, required: true },
    picture:  { type: String, default: "" },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;