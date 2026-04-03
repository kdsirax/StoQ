import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPortfolio extends Document {
  userId: mongoose.Types.ObjectId;
  ticker: string;
  qty: number;
  addedAt: Date;
}

const PortfolioSchema = new Schema<IPortfolio>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ticker: { type: String, required: true, uppercase: true, trim: true },
    qty:    { type: Number, required: true, min: 1 },
    addedAt:{ type: Date, default: Date.now },
  }
);

// Prevent duplicate ticker per user
PortfolioSchema.index({ userId: 1, ticker: 1 }, { unique: true });

const Portfolio: Model<IPortfolio> =
  mongoose.models.Portfolio ||
  mongoose.model<IPortfolio>("Portfolio", PortfolioSchema);

export default Portfolio;