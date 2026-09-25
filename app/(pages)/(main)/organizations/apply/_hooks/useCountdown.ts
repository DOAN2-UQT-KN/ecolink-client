import { useEffect, useState } from "react";

const secondsUntil = (target: Date | null) =>
  target ? Math.max(0, Math.ceil((target.getTime() - Date.now()) / 1000)) : 0;

/** Whole seconds left until `target`, ticking once a second; 0 once it has passed. */
export const useCountdown = (target: Date | null): number => {
  const [remaining, setRemaining] = useState(() => secondsUntil(target));

  useEffect(() => {
    setRemaining(secondsUntil(target));
    if (!target) return;
    const timer = window.setInterval(() => {
      const left = secondsUntil(target);
      setRemaining(left);
      if (left === 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  return remaining;
};

export const formatCountdown = (seconds: number): string =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;
