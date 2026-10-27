"use client";

import { useLayoutEffect } from "react";
import { applyFontSize, readFontSize } from "@/lib/font-size";

export function FontSizeSync() {
  useLayoutEffect(() => {
    applyFontSize(readFontSize());
  }, []);

  return null;
}
