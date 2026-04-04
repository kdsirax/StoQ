import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User    from "@/models/User";
import Portfolio from "@/models/Portfolio";
import News      from "@/models/News";

// GET /api/portfolio — fetch all stocks in user's portfolio
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const stocks = await Portfolio.find({ userId: session.user.id })
    .sort({ addedAt: -1 })
    .lean();

  return NextResponse.json({ stocks });
}

// POST /api/portfolio — add a stock
// Body: { ticker: "TCS", qty: 10 }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticker, qty } = await req.json();

  if (!ticker || !qty || qty < 1) {
    return NextResponse.json({ error: "Invalid ticker or quantity" }, { status: 400 });
  }

  await connectDB();

  try {
    const stock = await Portfolio.create({
      userId: session.user.id,
      ticker: ticker.toUpperCase().trim(),
      qty,
    });

    return NextResponse.json({ stock }, { status: 201 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json(
        { error: `${ticker.toUpperCase()} already in your portfolio` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}