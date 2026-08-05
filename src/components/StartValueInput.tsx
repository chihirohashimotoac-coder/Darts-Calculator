import { useId } from 'react';
import type { StartValueValidation } from '../domain/startValue';
import './StartValueInput.css';

interface StartValueInputProps {
  value: string;
  validation: StartValueValidation;
  onChange: (text: string) => void;
}

export function StartValueInput({ value, validation, onChange }: StartValueInputProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const hasError = !validation.ok;

  return (
    <section className="start-value" aria-label="引き算モードの開始値">
      <label className="start-value__label" htmlFor={inputId}>
        開始値（0以上の整数）
      </label>
      <input
        id={inputId}
        data-testid="start-value-input"
        className="start-value__input"
        /* スマートフォンで数字キーボードを開くための属性 */
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        enterKeyHint="done"
        value={value}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <p
        id={errorId}
        className="start-value__error"
        data-testid="start-value-error"
        role="alert"
      >
        {hasError ? validation.message : ''}
      </p>
    </section>
  );
}
