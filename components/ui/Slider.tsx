"use client";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: SliderProps) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between text-[11px] uppercase tracking-wider text-ink-2">
        <span>{label}</span>
        <span className="font-display text-ink">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
