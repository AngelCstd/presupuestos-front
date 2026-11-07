'use client';

import { useEffect, useState } from 'react';
import { Input, type InputProps } from '@/components/ui/Input';
import { parseAmountInput } from '@/lib/domain/money';

export interface AmountInputProps extends Omit<InputProps, 'value' | 'onChange' | 'type' | 'inputMode'> {
  /** Centavos string — lo que vive en el estado del formulario (TASK-front.md U13). */
  value: string;
  onChange: (cents: string) => void;
  autoWidth?: boolean;
}

function centsToDecimalText(cents: string): string {
  const isNegative = cents.startsWith('-');
  const digits = (isNegative ? cents.slice(1) : cents).padStart(3, '0');
  const whole = digits.slice(0, -2);
  const fraction = digits.slice(-2);
  return `${isNegative ? '-' : ''}${whole}.${fraction}`;
}

/**
 * El valor del formulario siempre son centavos string; la conversión pasa por
 * `parseAmountInput`, nunca a mano (TASK-front.md U13). Mientras el usuario escribe,
 * el texto visible puede no ser un monto válido todavía — eso es normal y no dispara
 * `onChange` hasta que sí lo sea.
 */
export function AmountInput({ value, onChange, autoWidth = false, ...rest }: AmountInputProps) {
  const [text, setText] = useState(() => centsToDecimalText(value));

  useEffect(() => {
    setText(centsToDecimalText(value));
  }, [value]);

  return (
    <Input
      {...rest}
      inputMode="decimal"
      value={text}
      style={
        autoWidth
          ? { ...rest.style, width: `${Math.max(4, text.length)}ch` }
          : rest.style
      }
      onFocus={(event) => {
        event.target.select();
        rest.onFocus?.(event);
      }}
      onChange={(event) => setText(event.target.value)}
      onBlur={(event) => {
        const parsed = parseAmountInput(event.target.value);
        if (parsed !== null) {
          onChange(parsed);
          setText(centsToDecimalText(parsed));
        } else {
          setText(centsToDecimalText(value));
        }
        rest.onBlur?.(event);
      }}
    />
  );
}
