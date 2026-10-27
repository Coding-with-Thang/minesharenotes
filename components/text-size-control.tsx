"use client";

import { useLayoutEffect, useState } from "react";
import { FONT_SIZE_OPTIONS, persistFontSize, readFontSize, type FontSize } from "@/lib/font-size";

export function TextSizeControl() {
  const [fontSize, setFontSize] = useState<FontSize>("normal");

  useLayoutEffect(() => {
    const stored = readFontSize();
    if (stored !== "normal") setFontSize(stored);
  }, []);

  function chooseFontSize(size: FontSize) {
    persistFontSize(size);
    setFontSize(size);
  }

  return (
    <div role="radiogroup" aria-label="Text size" className="text-size-options">
      {FONT_SIZE_OPTIONS.map((option) => {
        const selected = fontSize === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => chooseFontSize(option.id)}
            className={`text-size-option ${selected ? "text-size-option-selected" : ""}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
