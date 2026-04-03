import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Portfolio from "@/models/Portfolio";
import mongoose from "mongoose";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await connectDB();

  const holdings = await Portfolio.find({ userId: session.user.id }).lean();
  const userTickers = holdings.map((h) => h.ticker);

  console.log("User tickers for suggested:", userTickers); // debug

  const newsCol = mongoose.connection.db!.collection("news");

  const suggested = await newsCol.aggregate([
    {
      $match: {
        signal: { $in: ["BUY", "STRONG BUY"] },
        confidence_score: { $gte: 0.60 }, // lowered threshold
      },
    },
    { $unwind: "$stocks" },
    {
      $match: {
        // if portfolio is empty, show all; otherwise exclude owned
        ...(userTickers.length > 0 && { stocks: { $nin: userTickers } }),
      },
    },
    { $sort: { confidence_score: -1, publishedAt: -1 } },
    {
      $group: {
        _id:              "$stocks",
        ticker:           { $first: "$stocks" },
        signal:           { $first: "$signal" },
        confidence_score: { $first: "$confidence_score" },
        title:            { $first: "$title" },
        domain:           { $first: "$domain" },
        publishedAt:      { $first: "$publishedAt" },
        rsi:              { $first: "$rsi" },
        macd:             { $first: "$macd" },
      },
    },
    { $limit: 10 },
  ]).toArray();

  console.log("Suggested stocks found:", suggested.length); // debug

  return NextResponse.json({ suggested });
}