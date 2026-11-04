// oxlint-disable jsx-a11y/prefer-tag-over-role -- the SVG and the text form one image.
const carBody =
  "M3.6 14.6 C3.6 13.3 4.4 12.6 5.8 12.4 L7.4 12.2 L9.4 9.6 C9.9 9 10.5 8.7 11.3 8.7 L15.2 8.7 C16 8.7 16.6 9 17.1 9.6 L18.8 12.1 L19.4 12.2 C20.4 12.4 20.9 13 20.9 13.9 L20.9 15.4 C20.9 15.8 20.6 16.1 20.2 16.1 L3.9 16.1 C3.7 16.1 3.6 15.9 3.6 15.7 Z";
const carWindows =
  "M10.3 10.2 C10.5 9.9 10.8 9.8 11.2 9.8 L13.6 9.8 L13.6 12.1 L8.9 12.1 Z M14.6 9.8 L15.3 9.8 C15.7 9.8 16 10 16.2 10.3 L17.4 12.1 L14.6 12.1 Z";

// An 8-point star, for the wheels and the corner badge.
const starPath = (cx: number, cy: number, outer: number, inner: number) => {
  const points = Array.from({ length: 16 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 8;
    const radius = index % 2 ? inner : outer;
    const x = (cx + radius * Math.cos(angle)).toFixed(2);
    const y = (cy + radius * Math.sin(angle)).toFixed(2);
    return `${index ? "L" : "M"}${x} ${y}`;
  });
  return `${points.join(" ")} Z`;
};

const wheelPositions = [7.6, 16.9];

type LogoProps = {
  tone?: "light" | "dark";
};

export function Logo({ tone = "light" }: LogoProps) {
  const dark = tone === "dark";
  const tile = dark ? "fill-surface" : "fill-brand";
  const car = dark ? "fill-brand" : "fill-surface";

  // Logos never mirror, so this stays left to right in Arabic.
  return (
    <span
      aria-label="AutoSouk"
      className="inline-flex shrink-0 items-center gap-8"
      dir="ltr"
      role="img"
    >
      <svg aria-hidden="true" height="32" viewBox="0 0 24 24" width="32">
        <rect className={tile} height="24" rx="6.5" width="24" />
        <g transform="translate(-1.48 -0.6) scale(1.1)">
          <path className={car} d={carBody} />
          <path className={tile} d={carWindows} />
          {wheelPositions.map((x) => (
            <g key={x}>
              <circle className={tile} cx={x} cy="16.2" r="2.35" />
              <path className="fill-saffron" d={starPath(x, 16.2, 2.05, 1.55)} />
              <circle className={tile} cx={x} cy="16.2" r="0.6" />
            </g>
          ))}
        </g>
        <path className="fill-saffron" d={starPath(18.6, 6, 2.3, 1.75)} />
      </svg>
      <span
        aria-hidden="true"
        className={`type-h3 ${dark ? "text-surface" : "text-ink"}`}
      >
        Auto<span className={dark ? "text-saffron" : "text-brand"}>Souk</span>
      </span>
    </span>
  );
}
