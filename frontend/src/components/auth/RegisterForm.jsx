import Button from "../common/Button";
import FormField from "../common/FormField";


export default function RegisterForm({
    onSubmit,
    isLoading = false
}) {
    function handleSubmit(event) {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget));
      onSubmit?.(data);
    }

    return (
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormField lable="Username" name="username" placeholder="Username" />

        <FormField
          lable="Email"
          name="email"
          placeholder="exemple@growcore.dev"
        />

        <FormField
          lable="Password"
          name="password"
          placeholder="Minimum 8 characters"
        />

        <Button
            disabled={isLoading}
            className="mt-2 w-full"
        >
            {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </form>
    );
}