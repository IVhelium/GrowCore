export default function FormField({
  label,
  name,
  type = "text",
  as = "input",
  wrapperClassName = "",
  ...props
}) {
  const Component = as;

  return (
    <label className={`grid gap-2 ${wrapperClassName}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <Component
        name={name}
        type={as === "input" ? type : undefined}
        className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
        {...props}
      />
    </label>
  );
}
