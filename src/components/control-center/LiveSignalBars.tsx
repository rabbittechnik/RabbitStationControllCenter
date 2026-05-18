export function LiveSignalBars() {
  const heights = [4, 7, 5, 9, 6, 8];
  return (
    <div className="flex h-5 items-end gap-0.5 px-1">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-sm bg-neon-cyan/80"
          style={{
            height: `${h * 2}px`,
            animation: `pulse 1.${i + 2}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}
