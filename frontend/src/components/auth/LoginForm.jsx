import { useState } from "react";
import Button from "../common/Button";
import FormField from "../common/FormField";
import {
  getEmptyFieldMessage,
  getTrimmedFormData,
  hasEmptyRequiredFields,
} from "../../utils/formSpaceValidation";

export default function LoginForm({ onSubmit, isLoading = false, error = "" }) {
  const [clientError, setClientError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setClientError("");
    const data = getTrimmedFormData(event.currentTarget);

    if (hasEmptyRequiredFields(data, ["email", "password"])) {
      setClientError(getEmptyFieldMessage());
      return;
    }

    onSubmit?.(data);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <FormField
        label="Email"
        name="email"
        type="email"
        required
        placeholder="exemple@growcore.dev"
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        required
        placeholder="Enter password"
      />

      {(clientError || error) && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {clientError || error}
        </p>
      )}

      <Button type="submit" disabled={isLoading} className="mt-2 w-full">
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
