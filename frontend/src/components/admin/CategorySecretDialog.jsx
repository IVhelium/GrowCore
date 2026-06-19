import { useEffect, useRef, useState } from "react";
import { KeyRound, X } from "lucide-react";
import Button from "../common/Button";

export default function CategorySecretDialog({ request, onCancel, onConfirm }) {
  const [secret, setSecret] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!request) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSecret("");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [request]);

  if (!request) return null;

  function handleSubmit(event) {
    event.preventDefault();
    const value = secret.trim();
    if (value) onConfirm(value);
  }

  return (
    <div
      className="fixed inset-0 z-110 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-secret-title"
      onMouseDown={(event) =>
        event.target === event.currentTarget && onCancel()
      }
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
              <KeyRound size={20} />
            </span>
            <div>
              <h2
                id="category-secret-title"
                className="font-bold text-slate-950"
              >
                Confirm category action
              </h2>
              <p className="mt-1 text-sm text-slate-500">{request.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <label className="mt-5 grid gap-2">
          <span className="text-sm font-semibold text-slate-700">
            Management secret
          </span>
          <input
            ref={inputRef}
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            autoComplete="off"
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#4F8A5B]"
            required
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" style="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!secret.trim()}>
            Confirm
          </Button>
        </div>
      </form>
    </div>
  );
}
