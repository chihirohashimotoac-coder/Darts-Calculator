import { useId } from 'react';
import {
  NOTATION_FORMATS,
  NOTATION_FORMAT_EXAMPLES,
  NOTATION_FORMAT_LABELS,
  type NotationFormat,
} from '../domain/notation';
import './NotationSettings.css';

interface NotationSettingsProps {
  format: NotationFormat;
  onChange: (format: NotationFormat) => void;
}

export function NotationSettings({ format, onChange }: NotationSettingsProps) {
  const groupName = useId();

  return (
    <section className="notation-settings" aria-label="表記設定">
      <h2 className="notation-settings__title">表記設定</h2>
      <p className="notation-settings__description">
        履歴と直近入力の表示形式を選べます。設定はこの端末に保存されます。
      </p>

      <fieldset className="notation-settings__fieldset">
        <legend className="visually-hidden">履歴と直近入力の表記形式</legend>
        {NOTATION_FORMATS.map((value) => (
          <label
            key={value}
            className="notation-settings__option"
            data-testid={`notation-option-${value}`}
          >
            <input
              type="radio"
              name={groupName}
              value={value}
              checked={format === value}
              onChange={() => onChange(value)}
              data-testid={`notation-radio-${value}`}
            />
            <span className="notation-settings__option-text">
              <span className="notation-settings__option-label">
                {NOTATION_FORMAT_LABELS[value]}
              </span>
              <span className="notation-settings__option-example">
                {`例：${NOTATION_FORMAT_EXAMPLES[value]}`}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
    </section>
  );
}
