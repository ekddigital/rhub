/** Certified Cooking Committee financial report — Jinan 2026 (1 August 2026). */
export type CookingLineItem = {
  no: number;
  description: string;
  amount: number;
};

export type CookingTransfer = {
  recipient: string;
  purpose: string;
  amount: number;
};

export const COOKING_COMMITTEE_NARRATIVE = [
  "The Cooking Committee of the Liberian Student Union in China (LSUIC) was entrusted with planning, procuring, preparing, and serving meals for delegates and guests attending the 20th Annual Conference in Jinan, Shandong Province, from 24 to 27 July 2026.",
  "A total amount of RMB 18,113.03 was disbursed to the Committee to cover food items, cooking ingredients, kitchen utensils, transportation, and other operational expenses necessary for conference catering.",
  "According to the Committee's financial records, RMB 17,538.08 was expended, leaving an unexpended balance of RMB 574.95. The Committee maintained expenditure records for all purchases and transfers made during the conference period.",
  "The Cooking Committee successfully executed its assigned responsibilities while operating within the approved budget, demonstrating prudent financial management and accountability in the utilization of conference funds.",
] as const;

export const COOKING_FOOD_ITEMS: readonly CookingLineItem[] = [
  { no: 1, description: "Oil", amount: 322.1 },
  { no: 2, description: "Chicken Breast", amount: 209.0 },
  { no: 3, description: "Supermarket Purchases", amount: 82.0 },
  { no: 4, description: "Debai Food Mall", amount: 335.0 },
  { no: 5, description: "Cucumber", amount: 129.0 },
  { no: 6, description: "Salt", amount: 0.18 },
  { no: 7, description: "Food Items", amount: 167.42 },
  { no: 8, description: "Meat", amount: 483.0 },
  { no: 9, description: "Sausage", amount: 170.0 },
  { no: 10, description: "Mixed Vegetables", amount: 88.0 },
  { no: 11, description: "Chicken", amount: 168.0 },
  { no: 12, description: "Cow Skin", amount: 303.62 },
  { no: 13, description: "Beans", amount: 234.63 },
  { no: 14, description: "Turkey", amount: 931.2 },
  { no: 15, description: "Chicken", amount: 1_114.35 },
  { no: 16, description: "Okra", amount: 25.8 },
  { no: 17, description: "Bread", amount: 427.53 },
  { no: 18, description: "Rice", amount: 871.95 },
  { no: 19, description: "Mayonnaise", amount: 170.8 },
  { no: 20, description: "Flour", amount: 269.61 },
  { no: 21, description: "Sugar", amount: 75.0 },
  { no: 22, description: "Milk", amount: 191.67 },
  { no: 23, description: "Tomatoes", amount: 51.6 },
  { no: 24, description: "BBQ Soy Sauce", amount: 92.13 },
  { no: 25, description: "Pepper", amount: 230.78 },
  { no: 26, description: "Peanut Butter", amount: 36.4 },
  { no: 27, description: "Dry Crawfish", amount: 58.89 },
  { no: 28, description: "Butter", amount: 126.54 },
  { no: 29, description: "Potatoes", amount: 243.38 },
  { no: 30, description: "Garlic", amount: 52.44 },
  { no: 31, description: "Macaroni", amount: 138.11 },
  { no: 32, description: "Onions", amount: 67.42 },
  { no: 33, description: "Bitter Balls", amount: 68.61 },
  { no: 34, description: "Mixed Vegetables", amount: 234.13 },
];

export const COOKING_SEASONINGS: readonly CookingLineItem[] = [
  { no: 1, description: "Garlic Powder", amount: 29.9 },
  { no: 2, description: "Turmeric Powder", amount: 19.8 },
  { no: 3, description: "Yeast", amount: 54.48 },
  { no: 4, description: "Black Pepper", amount: 85.86 },
  { no: 5, description: "Spice Cubes", amount: 494.51 },
  { no: 6, description: "Condensed Milk", amount: 49.93 },
  { no: 7, description: "Ketchup", amount: 85.2 },
  { no: 8, description: "Onion Powder", amount: 57.8 },
  { no: 9, description: "Bay Leaf", amount: 20.38 },
  { no: 10, description: "Nutmeg", amount: 17.9 },
  { no: 11, description: "Baking Powder", amount: 76.95 },
  { no: 12, description: "Dry Vanilla", amount: 28.12 },
  { no: 13, description: "Liquid Vanilla", amount: 67.5 },
  { no: 14, description: "Benny Seed", amount: 19.88 },
  { no: 15, description: "Seasonings", amount: 306.21 },
];

export const COOKING_EQUIPMENT: readonly CookingLineItem[] = [
  { no: 1, description: "Baking Pan", amount: 78.66 },
  { no: 2, description: "Cook Spoon", amount: 118.4 },
  { no: 3, description: "Knife", amount: 59.9 },
  { no: 4, description: "Cooking Pan", amount: 529.74 },
  { no: 5, description: "Glasses", amount: 244.69 },
  { no: 6, description: "Plates", amount: 323.4 },
  { no: 7, description: "Blender", amount: 171.9 },
  { no: 8, description: "Napkins", amount: 1_605.02 },
  { no: 9, description: "Garbage Bags", amount: 64.7 },
  { no: 10, description: "Soap", amount: 48.8 },
  { no: 11, description: "Towel", amount: 29.6 },
];

export const COOKING_TRANSFERS: readonly CookingTransfer[] = [
  { recipient: "Mason", purpose: "Purchase of food items", amount: 2_935.8 },
  { recipient: "Jenneh", purpose: "Dry fish and oil", amount: 940.0 },
  { recipient: "John", purpose: "Gas and cooking tub", amount: 569.24 },
  { recipient: "Albert", purpose: "Beans purchase", amount: 100.0 },
  { recipient: "SF", purpose: "Miscellaneous expenses", amount: 37.0 },
  { recipient: "Kukor", purpose: "Fufu purchase", amount: 700.0 },
];

export const COOKING_TRANSPORTATION = 911.57;

export const COOKING_CERTIFICATION = {
  preparedBy: "Cooking Committee",
  reviewedBy: "Kukor Brooks",
  reviewedRole: "Cooking Committee Chairperson",
  reviewDate: "1 August 2026",
  approvedRole: "Conference Committee Chairman",
} as const;

export type CookingAppendixSection = {
  key: string;
  title: string;
  items: readonly CookingLineItem[];
};

export type CookingAppendixPagePlan = {
  pageIndex: number;
  pageCount: number;
  showIntro: boolean;
  showFundsReceived: boolean;
  sections: CookingAppendixSection[];
  showTransfers: boolean;
  showTransportation: boolean;
  showReconciliation: boolean;
  showCertification: boolean;
};

const COOKING_APPENDIX_SECTIONS: readonly CookingAppendixSection[] = [
  {
    key: "food",
    title: "A. Food Items, Meat, Vegetables and Groceries",
    items: COOKING_FOOD_ITEMS,
  },
  {
    key: "seasonings",
    title: "B. Seasonings, Baking Supplies and Condiments",
    items: COOKING_SEASONINGS,
  },
  {
    key: "equipment",
    title: "C. Kitchen Equipment and Supplies",
    items: COOKING_EQUIPMENT,
  },
];

/** Paginate certified cooking line items for Appendix A (~22 rows per page). */
export function buildCookingAppendixPages(
  rowsPerPage = 22,
): CookingAppendixPagePlan[] {
  const pages: CookingAppendixPagePlan[] = [];
  let sectionQueue = COOKING_APPENDIX_SECTIONS.map((section) => ({
    ...section,
    items: [...section.items],
  }));

  let pageIndex = 0;

  const pushPage = (plan: Omit<CookingAppendixPagePlan, "pageIndex" | "pageCount">) => {
    pages.push({ ...plan, pageIndex, pageCount: 0 });
    pageIndex += 1;
  };

  pushPage({
    showIntro: true,
    showFundsReceived: true,
    sections: [],
    showTransfers: false,
    showTransportation: false,
    showReconciliation: false,
    showCertification: false,
  });

  while (sectionQueue.length > 0) {
    const pageSections: CookingAppendixSection[] = [];
    let usedRows = 0;

    while (sectionQueue.length > 0 && usedRows < rowsPerPage) {
      const current = sectionQueue[0];
      const remaining = rowsPerPage - usedRows;
      const headerRows = pageSections.some((s) => s.key === current.key) ? 0 : 1;

      if (headerRows + current.items.length <= remaining) {
        pageSections.push({ ...current, items: [...current.items] });
        usedRows += headerRows + current.items.length;
        sectionQueue.shift();
        continue;
      }

      if (remaining - headerRows <= 0) break;

      const take = remaining - headerRows;
      pageSections.push({
        ...current,
        items: current.items.slice(0, take),
      });
      sectionQueue[0] = {
        ...current,
        items: current.items.slice(take),
      };
      usedRows = rowsPerPage;
    }

    pushPage({
      showIntro: false,
      showFundsReceived: false,
      sections: pageSections,
      showTransfers: false,
      showTransportation: false,
      showReconciliation: false,
      showCertification: false,
    });
  }

  pushPage({
    showIntro: false,
    showFundsReceived: false,
    sections: [],
    showTransfers: true,
    showTransportation: true,
    showReconciliation: true,
    showCertification: true,
  });

  const pageCount = pages.length;
  return pages.map((page) => ({ ...page, pageCount }));
}
