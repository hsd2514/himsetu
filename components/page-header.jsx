export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="rise mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-[65ch] text-sm leading-relaxed text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}
