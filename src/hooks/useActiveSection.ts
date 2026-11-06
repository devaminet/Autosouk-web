import { useEffect, useRef, useState } from "react";

// Ends a choice made by clicking once the person scrolls by themselves.
const userScrollEvents = ["wheel", "touchstart", "keydown"] as const;

// The section of a long page that is being read, for its table of contents.
// A section counts once its top passes the upper third of the window, and the
// last one counts at the bottom of the page, as it may never get that high.
// `ids` must keep the same identity between renders.
export const useActiveSection = (ids: readonly string[]) => {
  const [active, setActive] = useState(ids[0] ?? null);
  // A clicked link stays chosen while the page jumps to its section, which
  // can stop short of the upper third at the bottom of the page.
  const chosen = useRef(false);

  useEffect(() => {
    const update = () => {
      if (chosen.current) {
        return;
      }
      const root = document.documentElement;
      if (window.innerHeight + window.scrollY >= root.scrollHeight - 2 && root.scrollHeight > window.innerHeight) {
        setActive(ids.at(-1) ?? null);
        return;
      }
      const line = window.innerHeight / 3;
      let current = ids[0] ?? null;
      for (const id of ids) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= line) {
          current = id;
        }
      }
      setActive(current);
    };
    const release = () => {
      chosen.current = false;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    for (const name of userScrollEvents) {
      window.addEventListener(name, release, { passive: true });
    }
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      for (const name of userScrollEvents) {
        window.removeEventListener(name, release);
      }
    };
  }, [ids]);

  return {
    active,
    choose: (id: string) => {
      chosen.current = true;
      setActive(id);
    },
  };
};
