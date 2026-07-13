export type LampState = "off" | "active" | "warn" | "danger" | "stale";

export interface StatusLampProps {
  state?: LampState;
  label?: string;
  className?: string;
}

export function StatusLamp({ state = "off", label, className }: StatusLampProps) {
  return (
    <span
      className={["tr-lamp", `tr-lamp--${state}`, className].filter(Boolean).join(" ")}
      aria-label={label}
      role="img"
    />
  );
}
