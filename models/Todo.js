import mongoose from "mongoose";

const TodoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  completed: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

export default mongoose.models.Todo || mongoose.model("Todo", TodoSchema);
