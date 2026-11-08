// "Youssef B." for Youssef Benali: the first name and the last name's initial,
// as reviewers appear to everyone.
export const shortName = (name: string) => {
  const [first = "", ...rest] = name.trim().split(/\s+/u);
  const last = rest.at(-1);
  return last ? `${first} ${last[0]?.toUpperCase()}.` : first;
};
