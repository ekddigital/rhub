/** Sort booklet roster members alphabetically by display name (matches delegate roster). */
export function sortBookletMembersByName<T extends { name: string }>(
  members: T[],
): T[] {
  return [...members].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}
