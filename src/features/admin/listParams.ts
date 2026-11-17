import { useSearchParams } from "react-router";

// A list's filters and page, kept in the query string so a link shares them.
// Changing a filter goes back to the first page.
export const useListParams = <Key extends string>(keys: readonly Key[]) => {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Math.trunc(Number(params.get("page"))) || 1);
  const values = Object.fromEntries(keys.map((key) => [key, params.get(key) ?? ""])) as Record<Key, string>;

  const set = (changes: Partial<Record<Key, string>>) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes) as [Key, string | undefined][]) {
          if (value) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
        }
        next.delete("page");
        return next;
      },
      { replace: true },
    );
  };

  // The query string of another page of the same list.
  const hrefFor = (target: number) => {
    const next = new URLSearchParams(params);
    if (target > 1) {
      next.set("page", String(target));
    } else {
      next.delete("page");
    }
    const query = next.toString();
    return query ? `?${query}` : "?";
  };

  return { page, values, set, hrefFor };
};
