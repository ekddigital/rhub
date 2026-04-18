# EKD Digital Resource Hub (rHub)

![rHub Reference Converter](./public/rhub_playground_ref.png)

> **Centralized tools for researchers** — starting with a fast, privacy-first Reference Converter.

## 🎯 Overview

EKD Digital Resource Hub (rHub) is a comprehensive platform designed to streamline research workflows. Our flagship tool converts EndNote XML, RIS, and enriched exports into validated BibTeX format in seconds, helping researchers build efficient workflows with properly formatted references ready for LaTeX, bibliographies, or research ingestion.

**Perfect for:**

- 📚 Researchers switching between citation formats
- 🎓 Academics submitting to journals requiring LaTeX
- 📝 Authors managing large bibliographies
- 🏥 Clinicians working with medical literature
- 📊 Publishers handling reference standardization

## 🎥 Tutorial Video

**Learn how to use the Reference Converter in 3 minutes:**

[![rHub Tutorial - Convert EndNote XML to BibTeX](https://img.youtube.com/vi/R-gNKL9s6WU/maxresdefault.jpg)](https://youtu.be/R-gNKL9s6WU)

**[▶️ Watch Tutorial: Convert EndNote XML to BibTeX](https://youtu.be/R-gNKL9s6WU)**

_This tutorial covers file upload, conversion process, and downloading your branded BibTeX files._

## ⚡ Reference Converter Features

### **Fast & Reliable**

- Convert EndNote XML, RIS, and enriched exports to BibTeX
- Process hundreds of references in seconds
- Intelligent format detection and validation

### **Privacy-First**

- All conversions processed locally on our servers
- No third-party data sharing
- Conversions logged for reproducibility only

### **Research-Ready Output**

- Clean, validated BibTeX format
- LaTeX-ready with proper character escaping
- Branded file naming: `ekddigital_rhub_{filename}.bib`

### **Smart Options**

- ✅ Include abstracts and keywords
- ✅ LaTeX character escaping
- ✅ Customizable citation styles
- ✅ Warning system for data issues

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Using the Reference Converter

1. **Visit**: [https://rhub.ekddigital.com/tools/ref](https://rhub.ekddigital.com/tools/ref)
2. **Upload**: Your EndNote XML or RIS file
3. **Configure**: Conversion options (abstracts, keywords, etc.)
4. **Convert**: Click "Convert to BibTeX"
5. **Download**: Get your branded `.bib` file

## 🛠 Tech Stack

- **Framework**: Next.js 16.0.3 with App Router
- **Language**: TypeScript
- **Database**: Prisma ORM with MySQL
- **Styling**: Tailwind CSS + Custom EKD Digital Design System
- **Deployment**: Vercel Platform

## 📚 Documentation

- **Live Site**: [https://rhub.ekddigital.com](https://rhub.ekddigital.com)
- **API Docs**: [https://rhub.ekddigital.com/docs](https://rhub.ekddigital.com/docs)
- **Reference Converter**: [https://rhub.ekddigital.com/tools/ref](https://rhub.ekddigital.com/tools/ref)

## 🎨 Brand Guidelines

rHub follows the EKD Digital design system:

- **Gold**: `#C8A061` - Accent color for highlights and CTAs
- **Navy**: `#182E5F` - Primary brand color
- **Maroon**: `#8E0E00` - Secondary accent for warnings/alerts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is proprietary software owned by EKD Digital.

## 🔗 Links

- **Website**: [EKD Digital](https://ekddigital.com)
- **Resource Hub**: [rHub Platform](https://rhub.ekddigital.com)
- **Tutorial**: [YouTube - Reference Converter Guide](https://youtu.be/R-gNKL9s6WU)
- **Support**: Contact via [EKD Digital](https://ekddigital.com)

---

_Built with ❤️ by [EKD Digital](https://ekddigital.com) — Empowering researchers with better tools._

---

## 📋 Changelog

### 2026-04-19 — Conference Booklet Layout Overhaul

**Cover Page (`CoverPage.tsx`)**
- Removed president photo strip (H.E. Boakai + H.E. Xi Jinping) from the cover
- Increased org name label size (10.5px → 12.5px) and conference title (30px → 36px)
- Enlarged subtitle (13px → 15px) and date/venue frosted card (font 16px → 20px)
- Upgraded theme box: larger padding, bolder border, bigger label + italic text (12px → 14.5px), label renamed "Conference Theme"

**Leader Portrait Pages (`LeaderSection.tsx`)**
- Page header `sectionLabel` now shows the individual leader's official title (e.g. "President of the Republic of Liberia") instead of the generic section title — each page has its own correct header
- `LeaderPortraitPage` component no longer accepts a `sectionLabel` prop; it derives it directly from `leader.title`

**Committee Section (`CommitteeSection.tsx`)**
- Fully redesigned to use a 2-page layout when general committee members exist:
  - **Page 1**: Full-width Chairman hero card (96px avatar, blue background, gold badge, bio) + key officers (Vice-Chair, Secretary, Treasurer) in a 3-column grid with larger 64px avatars
  - **Page 2**: General committee members in a 3-column portrait grid with 56px avatars, name, title, and city
- Placeholders (`silhouette={true}`) auto-shown for members without photos; replaced live when photos are uploaded
- Page counter in `index.tsx` updated to allocate 2 pages for committee sections with general members

