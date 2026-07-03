import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, MessageSquareText, X } from "lucide-react";
import Button from "./Button";
import { ActionDialogContext } from "../../context/action-dialog-context";

const dialogIcons = {
  confirm: CheckCircle2,
  danger: AlertTriangle,
  prompt: MessageSquareText,
};

export default function ActionDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!dialog) return;

    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [dialog]);

  const closeDialog = useCallback((result) => {
    setDialog((currentDialog) => {
      currentDialog?.resolve(result);
      return null;
    });
  }, []);

  const openDialog = useCallback((options) => {
    return new Promise((resolve) => {
      setValue(options.defaultValue || "");
      setError("");
      setDialog({
        type: "confirm",
        tone: "confirm",
        confirmLabel: "Confirm",
        cancelLabel: "Cancel",
        ...options,
        resolve,
      });
    });
  }, []);

  const confirmAction = useCallback((options) => {
    return openDialog({
      ...options,
      type: "confirm",
    });
  }, [openDialog]);

  const promptAction = useCallback((options) => {
    return openDialog({
      confirmLabel: "Continue",
      ...options,
      type: "prompt",
    });
  }, [openDialog]);

  function handleSubmit(event) {
    event.preventDefault();

    if (dialog.type === "confirm") {
      closeDialog(true);
      return;
    }

    const trimmedValue = value.trim();

    if (dialog.required !== false && !trimmedValue) {
      setError(dialog.requiredMessage || "This field is required.");
      return;
    }

    if (dialog.minLength && trimmedValue.length < dialog.minLength) {
      setError(
        dialog.minLengthMessage ||
          `Please enter at least ${dialog.minLength} characters.`,
      );
      return;
    }

    closeDialog(trimmedValue);
  }

  const contextValue = {
    confirmAction,
    promptAction,
  };

  const Icon = dialogIcons[dialog?.tone] || dialogIcons[dialog?.type] || CheckCircle2;
  const isDanger = dialog?.tone === "danger";

  return (
    <ActionDialogContext.Provider value={contextValue}>
      {children}
      {dialog && (
        <div
          className="fixed inset-0 z-120 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="action-dialog-title"
          onMouseDown={(event) =>
            event.target === event.currentTarget && closeDialog(null)
          }
        >
          <form
            onSubmit={handleSubmit}
          className="w-full min-w-0 max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-3">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
                    isDanger
                      ? "bg-red-50 text-red-600"
                      : "bg-[#4F8A5B]/10 text-[#4F8A5B]"
                  }`}
                >
                  <Icon size={20} />
                </span>
                <div className="min-w-0">
                  <h2 id="action-dialog-title" className="break-anywhere font-bold text-slate-950">
                    {dialog.title}
                  </h2>
                  {dialog.description && (
                    <p className="break-anywhere mt-1 text-sm leading-6 text-slate-500">
                      {dialog.description}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => closeDialog(null)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {dialog.type === "prompt" && (
              <label className="mt-5 grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  {dialog.inputLabel || "Reason"}
                </span>
                <textarea
                  ref={inputRef}
                  value={value}
                  onChange={(event) => {
                    setValue(event.target.value);
                    if (error) setError("");
                  }}
                  rows={4}
                  maxLength={dialog.maxLength || 500}
                  className={`break-anywhere w-full resize-none rounded-lg border bg-white px-4 py-3 text-sm outline-none focus:border-[#4F8A5B] ${
                    error ? "border-red-300" : "border-slate-200"
                  }`}
                />
                {error && (
                  <span className="break-anywhere text-sm font-semibold text-red-600">
                    {error}
                  </span>
                )}
              </label>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button type="button" style="secondary" onClick={() => closeDialog(null)}>
                {dialog.cancelLabel}
              </Button>
              <Button type="submit" style={isDanger ? "danger" : "primary"}>
                {dialog.confirmLabel}
              </Button>
            </div>
          </form>
        </div>
      )}
    </ActionDialogContext.Provider>
  );
}
