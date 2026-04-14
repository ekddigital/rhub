export type DefaultConference = {
  id: string;
  slug: string;
  year: number;
  name: string;
  defaultSlug: string;
};

export async function fetchDefaultConference(): Promise<DefaultConference> {
  const res = await fetch("/api/conf/default", { cache: "no-store" });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(
      payload?.error || `Failed to load default conference (${res.status})`,
    );
  }
  return res.json();
}
