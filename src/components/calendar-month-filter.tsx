import { createContext, useContext, useState, type ReactNode } from "react";

const CalendarMonthContext = createContext<{
  month: string;
  setMonth: (month: string) => void;
}>({ month: "", setMonth: () => undefined });

export function CalendarMonthProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState("");
  return (
    <CalendarMonthContext.Provider value={{ month, setMonth }}>
      {children}
    </CalendarMonthContext.Provider>
  );
}

export function useCalendarMonth() {
  return useContext(CalendarMonthContext);
}

export function isInCalendarMonth(value: unknown, month: string) {
  if (!month) return true;
  return typeof value === "string" && value.slice(0, 7) === month;
}
