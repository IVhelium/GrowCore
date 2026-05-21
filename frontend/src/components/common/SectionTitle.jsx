
export default function SectionTitle({ 
    pretitle, 
    title, 
    text, 
    action 
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        {pretitle && (
          <p className="text-md font-semibold uppercase tracking-[0.18em] text-indigo-500">
            {pretitle}
          </p>
        )}
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
          {title}
        </h2>
        {text && <p className="mt-3 max-w-2xl text-slate-500">{text}</p>}
      </div>
      {action}
    </div>
  );
}
