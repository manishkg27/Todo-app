import { connectDB } from "@/lib/mongodb";
import Todo from "@/models/Todo";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  await connectDB();
  const body = await req.json();
  const todo = await Todo.findByIdAndUpdate(params.id, body, { new: true });
  return NextResponse.json(todo);
}

export async function DELETE(req, { params }) {
  await connectDB();
  await Todo.findByIdAndDelete(params.id);
  return NextResponse.json({ message: "Deleted" });
}
