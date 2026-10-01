import { useEffect, useState } from "react";

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    const frame = requestAnimationFrame(update);
    const interval = setInterval(update, intervalMs);

    return () => {
      cancelAnimationFrame(frame);
      clearInterval(interval);
    };
  }, [intervalMs]);

  return now;
}
