interface MiniSparklineProps {
  color?: string;
  data?: number[];
  className?: string;
}

export function MiniSparkline({
  color = '#00e676',
  data = [4, 6, 5, 8, 7, 9, 8, 10, 9, 11],
  className = '',
}: MiniSparklineProps) {
  const w = 64;
  const h = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} className={`opacity-80 ${className}`} viewBox={`0 0 ${w} ${h}`}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="sparkline-path"
      />
    </svg>
  );
}
