import { connectDB } from "@/lib/mongodb";
import Todo from "@/models/Todo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET — find the most recently soft-deleted task (if restorable)
export async function GET() {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

  // Auto-cleanup: permanently delete tasks older than 10 days
  await Todo.deleteMany({
    userId: session.user.id,
    deletedAt: { $ne: null, $lt: tenDaysAgo },
  });

  // Find the most recently deleted task
  const lastDeleted = await Todo.findOne({
    userId: session.user.id,
    deletedAt: { $ne: null },
  }).sort({ deletedAt: -1 });

  if (!lastDeleted) {
    return NextResponse.json(
      { error: "Cannot restore. The deleted task is older than 10 days and has been permanently removed." },
      { status: 404 }
    );
  }

  return NextResponse.json(lastDeleted);
}

// POST — restore the most recently soft-deleted task
export async function POST() {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

  // Auto-cleanup: permanently delete tasks older than 10 days
  await Todo.deleteMany({
    userId: session.user.id,
    deletedAt: { $ne: null, $lt: tenDaysAgo },
  });

  // Find the most recently deleted task
  const lastDeleted = await Todo.findOne({
    userId: session.user.id,
    deletedAt: { $ne: null },
  }).sort({ deletedAt: -1 });

  if (!lastDeleted) {
    return NextResponse.json(
      { error: "Cannot restore last deleted task — it has been deleted for more than 10 days." },
      { status: 404 }
    );
  }

  // Get next order value
  const count = await Todo.countDocuments({ userId: session.user.id });

  // Restore the task
  lastDeleted.deletedAt = null;
  lastDeleted.order = count;
  await lastDeleted.save();

  return NextResponse.json(lastDeleted);
}