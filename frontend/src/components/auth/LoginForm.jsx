import Button from "../common/Button";
import FormField from "../common/FormField";

export default function LoginForm({ onSubmit, isLoading = false }) {
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
        placeholder="exemple@growcore.dev"
      />
      <FormField
        lable="Password"
        name="password"
        type="password"
        placeholder="Enter password"
      />

      <Button disabled={isLoading} className="mt-2 w-full">
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
