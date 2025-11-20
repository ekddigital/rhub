import {
  Home,
  Wrench,
  BookOpen,
  Code2,
  FileText,
  Layers,
  Sparkles,
  Link2,
  Download,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon?: LucideIcon;
  description?: string;
  badge?: string;
  external?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// Main navigation links
export const mainNavItems: NavItem[] = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "Resources",
    href: "/#resources",
    icon: Layers,
    description: "Browse all available tools",
  },
  {
    name: "Downloads",
    href: "/downloads",
    icon: Download,
    description: "Access important documents",
  },
  {
    name: "Documentation",
    href: "/docs",
    icon: BookOpen,
    badge: "Coming Soon",
  },
  {
    name: "API",
    href: "/api",
    icon: Code2,
    badge: "Coming Soon",
  },
];

// Featured resources for quick access
export const featuredResources: NavItem[] = [
  {
    name: "Reference Converter",
    href: "/tools/ref",
    icon: FileText,
    description: "Convert citations to BibTeX",
  },
  {
    name: "URL Shortener",
    href: "/tools/s",
    icon: Link2,
    description: "Create short, branded links",
  },
  {
    name: "LaTeX to Word",
    href: "#",
    icon: Wrench,
    description: "Convert LaTeX to Word",
    badge: "Coming Soon",
  },
  {
    name: "API Playground",
    href: "#",
    icon: Sparkles,
    description: "Test our APIs",
    badge: "Coming Soon",
  },
];

// Footer navigation sections
export const footerNavSections: NavSection[] = [
  {
    title: "Resources",
    items: [
      { name: "Reference Converter", href: "/tools/ref" },
      { name: "URL Shortener", href: "/tools/s" },
      { name: "LaTeX to Word", href: "#" },
      { name: "API Playground", href: "#" },
      { name: "All Resources", href: "/#resources" },
    ],
  },
  {
    title: "Documentation",
    items: [
      { name: "Getting Started", href: "/docs" },
      { name: "API Reference", href: "#" },
      { name: "Guides", href: "#" },
      { name: "Examples", href: "#" },
    ],
  },
  {
    title: "Company",
    items: [
      {
        name: "About EKD Digital",
        href: "https://ekddigital.com",
        external: true,
      },
      {
        name: "Our Services",
        href: "https://ekddigital.com/services",
        external: true,
      },
      {
        name: "Contact",
        href: "https://ekddigital.com/contact",
        external: true,
      },
      {
        name: "Careers",
        href: "https://ekddigital.com/careers",
        external: true,
      },
    ],
  },
  {
    title: "Legal",
    items: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Cookie Policy", href: "#" },
    ],
  },
];

// Social media links
export const socialLinks = [
  {
    name: "Email",
    href: "mailto:support@ekddigital.com",
    icon: "Mail",
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/ekddigital",
    icon: "Linkedin",
  },
  {
    name: "GitHub",
    href: "https://github.com/ekddigital",
    icon: "Github",
  },
  {
    name: "Twitter",
    href: "https://twitter.com/ekddigital",
    icon: "Twitter",
  },
];
