const ITEMS = [
  'Web Development',
  'Cybersecurity',
  'Penetration Testing',
  'Secure by Design',
  'Network Security',
  'E-Commerce',
  'UI / UX',
];

function TickerList() {
  return (
    <ul className="flex items-center shrink-0" aria-hidden>
      {ITEMS.map((item, i) => (
        <li key={i} className="flex items-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground whitespace-nowrap px-8">
            {item}
          </span>
          <span className="text-primary/50 text-xs select-none shrink-0">·</span>
        </li>
      ))}
    </ul>
  );
}

export function MarqueeTicker() {
  return (
    <div className="w-full overflow-hidden py-3 bg-background/40">
      <div className="flex items-center marquee-track">
        <TickerList />
        <TickerList />
      </div>
    </div>
  );
}
