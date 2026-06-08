import { useState } from "react";
import { getApiError } from "../../utils/getApiError";
import { useAutoDismissMessage } from "../../hooks/useAutoDismissMessage";
import FormField from "./../common/FormField";
import Button from "../common/Button";

export default function ProfileForm({ user, onSave, hasPendingAvatar = false }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useAutoDismissMessage("");
  const [error, setError] = useAutoDismissMessage("");
  const [form, setForm] = useState(() => ({
    username: user?.username || "",
    description: user?.description || "",
  }));

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    if (!form.username.trim()) {
      setError("Fill in all required fields. Spaces only are not allowed.");
      setIsLoading(false);
      return;
    }

    try {
      await onSave?.({
        username: form.username.trim(),
        description: form.description.trim() || null,
      });
      setMessage(
        hasPendingAvatar
          ? "Profile and avatar updated successfully"
          : "Profile updated successfully",
      );
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to update profile"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-950">Profile detail</h2>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <FormField
          label="Username"
          name="username"
          required
          minLength={3}
          maxLength={32}
          value={form.username}
          onChange={(event) =>
            setForm((state) => ({ ...state, username: event.target.value }))
          }
        />

        <FormField
          label="Email"
          name="email"
          type="email"
          value={user?.email || ""}
          disabled
        />

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-500">
            Description
          </span>
          <textarea
            name="description"
            maxLength={300}
            rows={4}
            value={form.description}
            onChange={(event) =>
              setForm((state) => ({
                ...state,
                description: event.target.value,
              }))
            }
            placeholder="Tell others about your greenhouse project..."
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B] resize-none"
          />
          <span className="text-right text-xs text-slate-400">
            {form.description.length}/300
          </span>
        </label>

        {message && (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isLoading} className="w-fit">
          {isLoading ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </section>
  );
}
