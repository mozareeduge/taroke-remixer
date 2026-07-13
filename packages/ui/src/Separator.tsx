import { Separator as AriaSeparator, type SeparatorProps } from "react-aria-components";

export function Separator({ className, ...props }: SeparatorProps & { className?: string }) {
  return <AriaSeparator className={["tr-separator", className].filter(Boolean).join(" ")} {...props} />;
}
