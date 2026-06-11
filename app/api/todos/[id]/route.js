import { connectDB } from "@/lib/mongodb";
import Todo from "@/models/Todo";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  await connectDB();
  const body = await req.json();
  const { id } = await params;
  const todo = await Todo.findByIdAndUpdate(id, body, { new: true });
  return NextResponse.json(todo);
}

export async function DELETE(req, { params }) {
  await connectDB();
  const { id } = await params;
  // Soft-delete: set deletedAt instead of removing
  const todo = await Todo.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
  if (!todo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ message: "Deleted" });
}