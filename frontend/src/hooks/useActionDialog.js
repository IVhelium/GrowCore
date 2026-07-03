import { useContext } from "react";
import { ActionDialogContext } from "../context/action-dialog-context";

export function useActionDialog() {
  const context = useContext(ActionDialogContext);

  if (!context) {
    throw new Error("useActionDialog must be used inside ActionDialogProvider");
  }

  return context;
}
