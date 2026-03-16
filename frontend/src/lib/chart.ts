import { formatShortDate } from "@/lib/weather";

export const sharedTimeAxisProps = {
  dataKey: "timeKey",
  tick: { fontSize: 11 },
  tickFormatter: (value: string) => formatShortDate(value),
  tickMargin: 12,
  interval: "preserveStartEnd" as const,
  minTickGap: 32,
  angle: -30,
  textAnchor: "end" as const,
  height: 56,
};
