import { TextField, Label, Input, FieldError, type TextFieldProps } from "react-aria-components";

export interface FieldProps extends TextFieldProps {
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  className?: string;
}

export function Field({ label, placeholder, errorMessage, className, ...props }: FieldProps) {
  return (
    <TextField className={["tr-field", className].filter(Boolean).join(" ")} {...props}>
      {label && <Label className="tr-field__label">{label}</Label>}
      <Input className="tr-field__input" {...(placeholder !== undefined ? { placeholder } : {})} />
      {errorMessage && <FieldError className="tr-field__error">{errorMessage}</FieldError>}
    </TextField>
  );
}
