export function slugify(fullName: string): string {
  return fullName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Injectable `exists` check so this stays testable without a real DB call —
// the real caller (createAmbassador) passes a function backed by Prisma.
export async function uniqueAmbassadorSlug(
  fullName: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = slugify(fullName);
  if (!(await exists(base))) return base;

  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = Math.random().toString(36).slice(2, 8);
    const candidate = `${base}-${suffix}`;
    if (!(await exists(candidate))) return candidate;
  }

  // Astronomically unlikely to be reached — five random 4-6 char suffixes
  // all colliding — but a caller must always get a string back.
  return `${base}-${Date.now().toString(36)}`;
}
