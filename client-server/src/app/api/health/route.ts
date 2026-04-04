import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import News from "@/models/News";

export async function GET() {
  try {
    // Connect DB
    await connectDB();

    // Get total news count
    const newsCount = await News.countDocuments();

    // Get latest news article
    const latestNews = await News.findOne()
      .sort({ createdAt: -1 })
      .select("headline createdAt");

    return NextResponse.json({
      success: true,
      status: "healthy", 
      database: "connected",
      newsCount,
      latestArticle: latestNews
        ? {
            headline: latestNews.headline,
            createdAt: latestNews.createdAt,
          }
        : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health Check Error:", error);

    return NextResponse.json(
      {
        success: false,
        status: "unhealthy",
        database: "disconnected",
        error: "Server or database issue",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}