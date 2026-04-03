import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

import Portfolio from "@/models/Portfolio";


// DELETE /api/portfolio/:ticker — remove stock
export async function DELETE(
  _req: Request,
  { params }: { params: { ticker: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const result = await Portfolio.findOneAndDelete({
    userId: session.user.id,
    ticker: params.ticker.toUpperCase(),
  });

  if (!result) {
    return NextResponse.json({ error: "Stock not found" }, { status: 404 });
  }

  return NextResponse.json({ message: `${params.ticker.toUpperCase()} removed` });
}

// PATCH /api/portfolio/:ticker — update quantity
// Body: { qty: 20 }
export async function PATCH(
  req: Request,
  { params }: { params: { ticker: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { qty } = await req.json();

  if (!qty || qty < 1) {
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  }

  await connectDB();

  const stock = await Portfolio.findOneAndUpdate(
    { userId: session.user.id, ticker: params.ticker.toUpperCase() },
    { qty },
    { new: true }
  );

  if (!stock) {
    return NextResponse.json({ error: "Stock not found" }, { status: 404 });
  }

  return NextResponse.json({ stock });
}