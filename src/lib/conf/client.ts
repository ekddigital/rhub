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
    throw new Error("Failed to load default conference");
  }
  return res.json();
}
