import { useState } from "react";
import Button from "../common/Button";
import FormField from "../common/FormField";


export default function RegisterForm({
  onSubmit,
  isLoading = false,
  error = ""
}) {
  const [clientError, setClientError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setClientError("");

    const data = Object.fromEntries(new FormData(event.currentTarget));

    onSubmit?.({
      username: data.username.trim(),
      email: data.email.trim(),
      password: data.password,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <FormField lable="Username" name="username" required minLenght={3} maxLenght={25} placeholder="Username" />

      <FormField
        lable="Email"
        name="email"
        required
        placeholder="exemple@growcore.dev"
      />

      <FormField
        lable="Password"
        name="password"
        type="password"
        required
        minLenght={8}
        maxLenght={72}
        placeholder="Minimum 8 characters"
      />

      {(clientError || error) && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {clientError || error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full"
      >
        {isLoading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}