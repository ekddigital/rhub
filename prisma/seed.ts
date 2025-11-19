import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.conversionJob.deleteMany();
  await prisma.resourceAction.deleteMany();
  await prisma.resource.deleteMany();

  // Seed Reference Converter
  const refConverter = await prisma.resource.create({
    data: {
      slug: "ref",
      title: "Reference Converter",
      tagline: "Transform citation exports into clean BibTeX",
      summary:
        "Convert EndNote XML, RIS, and enriched exports into validated BibTeX entries. Built to handle complex reference lists from academic databases.",
      category: "CONVERTER",
      status: "LIVE",
      featured: true,
      metadata: {
        supportedFormats: ["xml", "ris", "enl"],
        outputFormats: ["bibtex", "biblatex"],
        features: [
          "EndNote XML parsing",
          "RIS format support",
          "LaTeX character escaping",
          "Semantic Scholar enrichment (planned)",
          "CrossRef metadata (planned)",
        ],
      },
      actions: {
        create: [
          {
            label: "Convert Now",
            description: "Start converting your references",
            type: "INTERNAL",
            url: "/tools/ref",
            order: 1,
          },
          {
            label: "View Docs",
            description: "Learn about supported formats",
            type: "DOCUMENTATION",
            url: "/docs/ref",
            order: 2,
          },
        ],
      },
    },
  });

  // Seed LaTeX to Word Converter (Coming Soon)
  const latexConverter = await prisma.resource.create({
    data: {
      slug: "latex-to-word",
      title: "LaTeX to Word",
      tagline: "Convert academic papers to Word format",
      summary:
        "Transform LaTeX documents into editable Word files while preserving formatting, equations, and citations. Perfect for journal submissions.",
      category: "CONVERTER",
      status: "DRAFT",
      featured: false,
      metadata: {
        plannedFeatures: [
          "Math equation conversion",
          "Bibliography preservation",
          "Table and figure handling",
          "Style template matching",
        ],
      },
      actions: {
        create: [
          {
            label: "Coming Soon",
            description: "This tool is under development",
            type: "DOCUMENTATION",
            url: "/docs/latex-to-word",
            order: 1,
          },
        ],
      },
    },
  });

  // Seed API Playground
  const apiPlayground = await prisma.resource.create({
    data: {
      slug: "api-playground",
      title: "API Testing Ground",
      tagline: "Test and explore EKD Digital APIs",
      summary:
        "Interactive API documentation and testing interface for all EKD Digital services. Try endpoints, view responses, and generate code snippets.",
      category: "PLAYGROUND",
      status: "DRAFT",
      featured: false,
      metadata: {
        plannedAPIs: [
          "Reference Conversion API",
          "Document Transformation API",
          "Data Processing API",
        ],
      },
      actions: {
        create: [
          {
            label: "Explore APIs",
            description: "Browse available endpoints",
            type: "INTERNAL",
            url: "/playground",
            order: 1,
          },
        ],
      },
    },
  });

  console.log("✅ Seeded resources:", {
    refConverter: refConverter.slug,
    latexConverter: latexConverter.slug,
    apiPlayground: apiPlayground.slug,
  });

  // Create sample conversion jobs for reference
  const sampleJob = await prisma.conversionJob.create({
    data: {
      resourceSlug: "ref",
      inputFormat: "xml",
      outputFormat: "bibtex",
      status: "COMPLETED",
      sourceName: "sample-references.xml",
      sourceSize: 15420,
      entryCount: 12,
      warningCount: 2,
      errorCount: 0,
      durationMs: 243,
      metadata: {
        options: {
          includeAbstract: false,
          includeKeywords: true,
          escapeLatex: true,
          citationStyle: "bibtex",
        },
      },
    },
  });

  console.log("✅ Created sample conversion job:", sampleJob.id);
  console.log("🎉 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
