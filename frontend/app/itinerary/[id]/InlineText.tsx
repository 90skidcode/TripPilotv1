"use client";
import { useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function InlineText({ value, onChange, placeholder = "Click to edit…", style, multiline, disabled }: Props) {
  const [focused, setFocused] = useState(false);
  const base: React.CSSProperties = {
    background: "transparent",
    border: "none",
    borderBottom: focused ? "2px solid #2D9B7A" : "2px solid transparent",
    outline: "none",
    width: "100%",
    padding: "1px 2px",
    margin: 0,
    font: "inherit",
    color: "inherit",
    resize: "none",
    cursor: disabled ? "default" : "text",
    transition: "border-color .15s",
    ...style,
  };

  if (multiline) {
    return (
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        style={{ ...base, display: "block", lineHeight: 1.5, overflow: "hidden" }}
        onFocus={() => !disabled && setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
      />
    );
  }

  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={base}
      onFocus={() => !disabled && setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={disabled}
    />
  );
}
