export type ConferenceFeePackage = {
  id: string;
  category: string;
  label: string;
  packageSummary: string;
  price: number;
};

export const CONFERENCE_FEE_PACKAGES: ConferenceFeePackage[] = [
  {
    id: "member-shared",
    category: "Member in Good Standing",
    label: "Shared Room",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 250,
  },
  {
    id: "member-single",
    category: "Member in Good Standing",
    label: "Single Room",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 600,
  },
  {
    id: "member-no-accommodation",
    category: "Member in Good Standing",
    label: "No Accommodation",
    packageSummary:
      "Feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 175,
  },
  {
    id: "member-guest-shared",
    category: "Member in Good Standing + Guest",
    label: "Shared Room",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 750,
  },
  {
    id: "member-guest-no-accommodation",
    category: "Member in Good Standing + Guest",
    label: "No Accommodation",
    packageSummary:
      "Feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 400,
  },
  {
    id: "non-good-standing-shared",
    category: "Non-Good Standing Members",
    label: "Shared Room",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 775,
  },
  {
    id: "non-good-standing-single",
    category: "Non-Good Standing Members",
    label: "Single Room",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 900,
  },
  {
    id: "non-good-standing-no-accommodation",
    category: "Non-Good Standing Members",
    label: "No Accommodation",
    packageSummary:
      "Feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 500,
  },
  {
    id: "partnering-org-single",
    category: "Partnering Organizations Guests",
    label: "Single Room",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 500,
  },
  {
    id: "guest-social-events",
    category: "Guests",
    label: "Social Events Only",
    packageSummary:
      "Pool party ticket, achievers awards night and dinner ticket (single event ticket 200 RMB, feedings included)",
    price: 400,
  },
  {
    id: "member-march-intake",
    category: "Member in Good Standing",
    label: "March Intake",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, pool party ticket, achievers awards night and dinner ticket",
    price: 330,
  },
  {
    id: "veteran-single",
    category: "Veteran",
    label: "Single Room",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, conference shirt, pool party ticket, achievers awards night and dinner ticket, VVIP table",
    price: 1000,
  },
  {
    id: "veteran-guest",
    category: "Veteran",
    label: "Guest Package",
    packageSummary:
      "Hotel accommodation, feeding, conference souvenirs, conference shirt, pool party ticket, achievers awards night and dinner ticket, VVIP table of 4",
    price: 3000,
  },
  {
    id: "conference-jersey",
    category: "Conference Jersey",
    label: "Male and Female Jersey Set",
    packageSummary: "Both male and female jersey set",
    price: 60,
  },
  {
    id: "achievers-platinum",
    category: "Achievers Award Dinner & Ms. LSUIC Pageant Patrons",
    label: "Platinum Table of 8",
    packageSummary: "Free flow drinks and food through the night",
    price: 700,
  },
  {
    id: "achievers-gold",
    category: "Achievers Award Dinner & Ms. LSUIC Pageant Patrons",
    label: "Gold Table of 5",
    packageSummary: "Free flow drinks and food through the night",
    price: 450,
  },
  {
    id: "achievers-vip",
    category: "Achievers Award Dinner & Ms. LSUIC Pageant Patrons",
    label: "VIP Table of 4",
    packageSummary: "Free flow drinks and food through the night",
    price: 350,
  },
];

export function getConferenceFeePackageById(packageId: string) {
  return CONFERENCE_FEE_PACKAGES.find((item) => item.id === packageId) ?? null;
}

export function getConferenceFeePackageByPrice(price: number) {
  return CONFERENCE_FEE_PACKAGES.find((item) => item.price === price) ?? null;
}

export function groupConferenceFeePackages() {
  return CONFERENCE_FEE_PACKAGES.reduce<Record<string, ConferenceFeePackage[]>>(
    (acc, item) => {
      (acc[item.category] ||= []).push(item);
      return acc;
    },
    {},
  );
}

export function formatFeeRmb(amount: number): string {
  return `RMB ${amount.toFixed(2)}`;
}
