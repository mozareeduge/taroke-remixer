import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";

export type ButtonVariant = "default" | "primary" | "danger" | "ghost" | "icon";

export interface ButtonProps extends AriaButtonProps {
  variant?: ButtonVariant;
}

export function Button({ variant = "default", className, ...props }: ButtonProps) {
  return (
    <AriaButton
      className={["tr-button", `tr-button--${variant}`, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
