/* Toggle — OFF by default (brand rule). Controlled or uncontrolled. */
import { useState } from "react";

export default function Toggle({
  checked,
  defaultChecked = false,
  onChange,
  label,
  disabled = false,
}) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(!!defaultChecked);
  const value = isControlled ? !!checked : internal;

  const flip = () => {
    if (disabled) return;
    const next = !value;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      disabled={disabled}
      onClick={flip}
      className={`jd-toggle${value ? " is-on" : ""}`}
    >
      <span className="jd-toggle-knob" aria-hidden="true" />
    </button>
  );
}
