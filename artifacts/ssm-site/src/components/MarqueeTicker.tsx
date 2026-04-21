const ITEMS = [
  'Web Development',
  'Cybersecurity',
  'CCTV & Surveillance',
  'Penetration Testing',
  'Secure by Design',
  'Network Security',
  'E-Commerce',
  'UI / UX',
];

const SEP = '·';

function TickerList() {
  return (
    <ul className="flex items-center gap-10 shrink-0" aria-hidden>
      {ITEMS.map((item, i) => (
        <li key={i} className="flex items-center gap-10">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground whitespace-nowrap">
            {item}
          </span>
          <span className="text-primary/50 text-xs select-none">{SEP}</span>
        </li>
      ))}
    </ul>
  );
}

export function MarqueeTicker() {
  return (
    <div className="w-full overflow-hidden py-3 bg-background/40">
      <div className="flex items-center gap-10 marquee-track">
        <TickerList />
        <TickerList />
        <TickerList />
      </div>
    </div>
  );
}
