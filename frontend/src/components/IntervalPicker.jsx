import { useState, useMemo } from 'react';
import { INTERVAL_PRESETS, intervalToMinutes, formatIntervalMinutes } from '../utils/interval';

function initialCustom(valueMinutes) {
  if (!valueMinutes || INTERVAL_PRESETS.some((p) => p.minutes === valueMinutes)) {
    return { value: '45', unit: 'minutes' };
  }
  if (valueMinutes % 1440 === 0 && valueMinutes >= 1440) {
    return { value: String(valueMinutes / 1440), unit: 'days' };
  }
  if (valueMinutes % 60 === 0 && valueMinutes >= 60) {
    return { value: String(valueMinutes / 60), unit: 'hours' };
  }
  return { value: String(valueMinutes), unit: 'minutes' };
}

export default function IntervalPicker({ valueMinutes, onChange }) {
  const presetMatch = INTERVAL_PRESETS.find((p) => p.minutes === valueMinutes);
  const customInit = initialCustom(valueMinutes);
  const [mode, setMode] = useState(presetMatch ? 'preset' : 'custom');
  const [preset, setPreset] = useState(presetMatch?.minutes ?? 15);
  const [customValue, setCustomValue] = useState(customInit.value);
  const [customUnit, setCustomUnit] = useState(customInit.unit);

  const effectiveMinutes = useMemo(() => {
    if (mode === 'preset') return preset;
    return intervalToMinutes(customValue, customUnit);
  }, [mode, preset, customValue, customUnit]);

  const applyPreset = (minutes) => {
    setMode('preset');
    setPreset(minutes);
    onChange(minutes);
  };

  const applyCustom = (val, unit) => {
    setMode('custom');
    const mins = intervalToMinutes(val, unit);
    if (mins) onChange(mins);
  };

  return (
    <div className="interval-picker">
      <div className="interval-picker-head">
        <span className="field-label">Check every</span>
        {effectiveMinutes && (
          <span className="interval-preview">
            <span className="interval-preview-dot" aria-hidden />
            {formatIntervalMinutes(effectiveMinutes)}
          </span>
        )}
      </div>

      <div className="interval-presets">
        {INTERVAL_PRESETS.map((p) => (
          <button
            key={p.minutes}
            type="button"
            className={`interval-pill ${mode === 'preset' && preset === p.minutes ? 'active' : ''}`}
            onClick={() => applyPreset(p.minutes)}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          className={`interval-pill interval-pill--custom ${mode === 'custom' ? 'active' : ''}`}
          onClick={() => applyCustom(customValue, customUnit)}
        >
          Custom
        </button>
      </div>

      <div className={`interval-custom-panel ${mode === 'custom' ? 'interval-custom-panel--open' : ''}`}>
        <p className="interval-custom-label">Your schedule</p>
        <div className="interval-custom">
          <input
            type="number"
            className="input input-glow interval-number"
            min={1}
            step={1}
            value={customValue}
            onChange={(e) => {
              setCustomValue(e.target.value);
              applyCustom(e.target.value, customUnit);
            }}
            onFocus={() => setMode('custom')}
            aria-label="Interval amount"
          />
          <select
            className="select input-glow interval-unit"
            value={customUnit}
            onChange={(e) => {
              setCustomUnit(e.target.value);
              applyCustom(customValue, e.target.value);
            }}
            onFocus={() => setMode('custom')}
            aria-label="Interval unit"
          >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </div>
        <p className="interval-hint">Any value from 5 minutes up to 7 days</p>
      </div>
    </div>
  );
}
