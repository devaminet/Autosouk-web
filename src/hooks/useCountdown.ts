import { useCallback, useEffect, useState } from "react";

// Counts down once a second, and stops at zero.
export const useCountdown = (seconds: number) => {
  const [remaining, setRemaining] = useState(seconds);
  const running = remaining > 0;

  useEffect(() => {
    if (!running) {
      return;
    }
    const timer = setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  const restart = useCallback(() => setRemaining(seconds), [seconds]);

  return { remaining, restart };
};
