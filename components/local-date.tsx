"use client";

export function LocalDate({
  value,
  withTime = false,
}: {
  value: string;
  withTime?: boolean;
}) {
  const d = new Date(value);
  return (
    <span suppressHydrationWarning>
      {withTime
        ? d.toLocaleString("en-IN")
        : d.toLocaleDateString("en-IN")}
    </span>
  );
}