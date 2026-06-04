import { connectDB } from "@/lib/mongodb";
import Todo from "@/models/Todo";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only fetch THIS user's todos
  const todos = await Todo.find({ userId: session.user.id }).sort({ order: 1 });
  return NextResponse.json(todos);
}

export async function POST(req) {
  await connectDB();
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description } = await req.json();
  const count = await Todo.countDocuments({ userId: session.user.id });
  const todo = await Todo.create({
    title,
    description,
    userId: session.user.id,
    order: count,
  });
  return NextResponse.json(todo, { status: 201 });
}
