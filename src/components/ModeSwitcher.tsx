import {
  CALCULATION_MODES,
  MODE_LABELS,
  type CalculationMode,
} from '../state/calculatorReducer';
import './ModeSwitcher.css';

interface ModeSwitcherProps {
  mode: CalculationMode;
  onChange: (mode: CalculationMode) => void;
}

const MODE_SYMBOLS: Record<CalculationMode, string> = {
  addition: '＋',
  subtraction: '−',
};

export function ModeSwitcher({ mode, onChange }: ModeSwitcherProps) {
  return (
    <div className="mode-switcher" role="group" aria-label="計算モードの切り替え">
      {CALCULATION_MODES.map((value) => {
        const isActive = value === mode;
        return (
          <button
            key={value}
            type="button"
            data-testid={`mode-${value}`}
            className="mode-switcher__button"
            aria-pressed={isActive}
            onClick={() => onChange(value)}
          >
            <span className="mode-switcher__main">
              <span className="mode-switcher__symbol" aria-hidden="true">
                {MODE_SYMBOLS[value]}
              </span>
              <span className="mode-switcher__label">{MODE_LABELS[value]}</span>
            </span>
            {/* 色だけに依存せず、選択中であることを文字でも示す */}
            <span className="mode-switcher__state">{isActive ? '選択中' : '未選択'}</span>
          </button>
        );
      })}
    </div>
  );
}
