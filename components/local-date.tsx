"use client";

import { useEffect, useState } from "react";

export function LocalDate({
  value,
  withTime = false,
}: {
  value: string;
  withTime?: boolean;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    const d = new Date(value);
    setText(
      withTime ? d.toLocaleString("en-IN") : d.toLocaleDateString("en-IN")
    );
  }, [value, withTime]);

  return <span suppressHydrationWarning>{text}</span>;
}