import { ClipboardEvent, KeyboardEvent, memo, useRef } from "react";

import { cn } from "@/libs/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
}

/**
 * One box per digit. The joined string is the value, so react-hook-form keeps validating a
 * plain 6-character field; pasting or OS autofill of the whole code fills every box at once.
 * A cleared box in the middle is kept as a space so later digits stay where they are (and
 * the `\d{6}` rule rejects it).
 */
export const OtpInput = memo(function OtpInput({
  value,
  onChange,
  onBlur,
  length = 6,
  disabled = false,
  invalid = false,
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, index) =>
    (value[index] ?? "").trim(),
  );
  const emit = (next: string[]) =>
    onChange(next.map((digit) => digit || " ").join("").trimEnd());

  const focusBox = (index: number) => {
    const target = inputsRef.current[Math.max(0, Math.min(index, length - 1))];
    target?.focus();
    target?.select();
  };

  const fillFrom = (index: number, typed: string) => {
    const incoming = typed.replace(/\D/g, "");
    if (!incoming) return;
    const next = digits.slice();
    incoming
      .slice(0, length - index)
      .split("")
      .forEach((digit, offset) => {
        next[index + offset] = digit;
      });
    emit(next);
    focusBox(index + incoming.length);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = digits.slice();
      if (next[index]) {
        next[index] = "";
      } else if (index > 0) {
        next[index - 1] = "";
        focusBox(index - 1);
      }
      emit(next);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    fillFrom(index, event.clipboardData.getData("text"));
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onBlur={onBlur}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1}`}
          disabled={disabled}
          value={digit}
          onFocus={(event) => event.target.select()}
          onChange={(event) => {
            // Typing into a filled box leaves both digits in it; keep only the new one.
            const typed = event.target.value;
            fillFrom(
              index,
              digit && typed.length === 2 ? typed.replace(digit, "") : typed,
            );
          }}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          className={cn(
            "h-[56px] w-[44px] rounded-[10px] border border-[rgba(136,122,71,0.5)] bg-white text-center font-display-5 text-foreground outline-none transition-[color,box-shadow,border-color] sm:h-[64px] sm:w-[52px]",
            "focus-visible:border-button-accent focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            invalid && "border-destructive",
          )}
        />
      ))}
    </div>
  );
});

export default OtpInput;
