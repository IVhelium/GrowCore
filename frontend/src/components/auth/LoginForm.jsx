import Button from "../common/Button";
import FormField from "../common/FormField";

export default function LoginForm({ 
  onSubmit, 
  isLoading = false,
  error ="" 
}) {
  function handleSubmit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    onSubmit?.(data);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <FormField
        lable="Email"
        name="email"
        type="email"
        required
        placeholder="exemple@growcore.dev"
      />
      <FormField
        lable="Password"
        name="password"
        type="password"
        required
        placeholder="Enter password"
      />

      {error && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isLoading} className="mt-2 w-full">
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
