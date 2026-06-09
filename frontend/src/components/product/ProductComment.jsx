import { useState } from "react";
import { Star } from "lucide-react";
import Button from "../common/Button";
import UserMiniCard from "../user/UserMiniCard";
import {
  getTrimmedFormData,
  getEmptyFieldMessage,
  hasEmptyRequiredFields,
} from "../../utils/formSpaceValidation";

const demoComments = [
  {
    id: 1,
    rating: 5,
    text: "Stable readings and easy installation in my greenhouse controller.",
    createdAt: "May 12, 2026",
    user: {
      username: "Max Green",
      public_id: "#A1B2C3D4E5",
      avatar_url: null,
    },
  },
  {
    id: 2,
    rating: 4,
    text: "Good sensor for the price. Cable could be longer.",
    createdAt: "May 04, 2026",
    user: {
      username: "Anna Field",
      public_id: "#B2C3D4E5F6",
      avatar_url: null,
    },
  },
];

function RatingStars({ value }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={16}
          fill={index < value ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

export default function ProductComments({ comments = demoComments, onSubmit }) {
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const data = getTrimmedFormData(event.currentTarget);

    if (hasEmptyRequiredFields(data, ["rating", "text"])) {
      setError(getEmptyFieldMessage());
      return;
    }

    onSubmit?.(data);
    event.currentTarget.reset();
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-950">Customer reviews</h3>

          <p className="mt-1 text-sm text-slate-500">
            Reviews and comments from GrowCore users.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4"
      >
        <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)_auto] md:items-end">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Rating</span>

            <select
              name="rating"
              required
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4F8A5B]"
            >
              <option value="">Select</option>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">
              Comment
            </span>

            <input
              name="text"
              required
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#4F8A5B]"
              placeholder="Write your comment..."
            />
          </label>

          <Button type="submit">Send</Button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </form>

      <div className="mt-6 grid gap-4">
        {comments.map((comment) => (
          <article
            key={comment.id}
            className="rounded-xl border border-slate-200 p-5"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <UserMiniCard user={comment.user} />

              <div className="shrink-0">
                <RatingStars value={comment.rating} />
                <p className="mt-1 text-xs text-slate-400">
                  {comment.createdAt}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {comment.text}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
