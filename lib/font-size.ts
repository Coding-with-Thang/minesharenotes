export const FONT_SIZE_OPTIONS = [
  { id: "smaller", label: "Smaller" },
  { id: "small", label: "Small" },
  { id: "normal", label: "Normal" },
  { id: "large", label: "Large" },
  { id: "larger", label: "Larger" },
] as const;

export type FontSize = (typeof FONT_SIZE_OPTIONS)[number]["id"];

export const FONT_SIZE_STORAGE_KEY = "mineshare-font-size";

const SCALED_FONT_SIZES = FONT_SIZE_OPTIONS.map((option) => option.id).filter(
  (id) => id !== "normal",
);

export function isFontSize(value: string | null): value is FontSize {
  return FONT_SIZE_OPTIONS.some((option) => option.id === value);
}

export function readFontSize(): FontSize {
  try {
    const stored = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    return isFontSize(stored) ? stored : "normal";
  } catch {
    return "normal";
  }
}

export function applyFontSize(size: FontSize) {
  if (size === "normal") {
    delete document.documentElement.dataset.fontSize;
    return;
  }
  document.documentElement.dataset.fontSize = size;
}

export function persistFontSize(size: FontSize) {
  applyFontSize(size);
  try {
    if (size === "normal") localStorage.removeItem(FONT_SIZE_STORAGE_KEY);
    else localStorage.setItem(FONT_SIZE_STORAGE_KEY, size);
  } catch {
    // Storage can be unavailable in private mode. The current page still updates.
  }
}

export const fontSizeBootScript = `(() => {
  try {
    var size = localStorage.getItem(${JSON.stringify(FONT_SIZE_STORAGE_KEY)});
    var allowed = ${JSON.stringify(SCALED_FONT_SIZES)};
    if (allowed.indexOf(size) !== -1) document.documentElement.setAttribute("data-font-size", size);
  } catch (e) {}
})();`;
