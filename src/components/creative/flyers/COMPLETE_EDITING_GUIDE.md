# Complete Image & Content Editing Guide

## 🎯 Overview

The flyer system now supports comprehensive editing of ALL content including:

- ✅ Logo uploads with preview
- ✅ QR code uploads with preview
- ✅ Multi-line text editing (headline, body, contact info)
- ✅ Footer/contact information editing
- ✅ Visual previews of all uploaded images

---

## 📤 Image Upload Features

### Logo Upload

**Location:** Branding Section in Dashboard

**Options:**

1. **Upload File:**

   - Click "Upload Logo Image" button
   - Browse and select image from computer
   - Supports: PNG, JPG, SVG, WebP
   - Auto-converts to base64 for embedding

2. **Use URL/Path:**
   - Enter public URL: `https://example.com/logo.png`
   - Or local path: `/logo.png`
   - Use existing web-hosted images

**Features:**

- ✅ Live preview thumbnail (80x80px)
- ✅ Shows current logo path/status
- ✅ Remove button to clear logo
- ✅ Toast notification on successful upload

---

### QR Code Upload

**Location:** QR Code Section in Dashboard

**Options:**

1. **Upload File:**

   - Click "Upload QR Code Image" button
   - Select QR code image file
   - Best size: 200x200 to 400x400 pixels

2. **Use URL/Path:**
   - Enter QR code image URL
   - Use generated QR codes from external services

**Features:**

- ✅ Large preview thumbnail (80x80px)
- ✅ Shows label text
- ✅ Remove button to clear QR code
- ✅ Template compatibility check (warns if template doesn't support QR)

**QR Code Label:**

- Customizable text below QR code
- Examples: "SCAN TO REGISTER", "SCAN FOR INFO", "JOIN US"

**Recommended QR Generators:**

- qr-code-generator.com
- qr.io
- goqr.me

---

## 📝 Multi-Line Text Editing

### How It Works

All text fields now support **line breaks** using the Enter key:

### Headline

- **Field Type:** Textarea (2 rows)
- **Multi-line:** ✅ Press Enter for new lines
- **Tip:** Create eye-catching multi-line headlines
- **Example:**
  ```
  JICF SPORTS DAY
  2025 EDITION
  ```

### Body Text

- **Field Type:** Textarea (4 rows)
- **Multi-line:** ✅ Press Enter for new lines
- **Perfect for:** Event details, descriptions, multi-line info
- **Example:**

  ```
  DATE: October 6, 2025
  TIME: 1:00 PM - 5:00 PM

  LOCATION: University Sports Ground
  济南大学(主校区)-西2门

  Activities: Sports • Games • Food • Music
  ```

### Contact Information (Footer)

**All fields support multi-line:**

1. **Email:**

   ```
   admin@jinanicf.com
   info@jinanicf.com
   ```

2. **Phone:**

   ```
   +1 (555) 123-4567
   +1 (555) 987-6543
   ```

3. **Website:**

   ```
   jinanicf.formaloo.co/register
   www.jinanicf.com
   ```

4. **Address:**
   ```
   123 Main Street
   Jinan, Shandong Province
   China
   ```

**Features:**

- ✅ All fields use Textarea (2 rows each)
- ✅ Line breaks automatically render in preview
- ✅ Font size and color customizable
- ✅ Positioned at bottom of flyer (editable Y position)

---

## 🎨 Complete Editing Workflow

### Step 1: Select Template

- Open Flyer Dashboard V2
- Choose from 13 templates in dropdown
- Templates with QR: QR Code Event, Detailed Event

### Step 2: Upload Images

**Logo:**

1. Go to "Branding" section
2. Click "Upload Logo Image" or enter URL
3. Preview appears instantly
4. Adjust position and size as needed

**QR Code:**

1. Go to "QR Code" section
2. Upload generated QR code image
3. Add custom label text
4. Preview shows immediately

### Step 3: Edit Text Content

**Headline:**

- Enter main title
- Press Enter for multi-line

**Body Text:**

- Enter event details
- Use Enter for line breaks
- Format info clearly:

  ```
  DATE: [date]
  TIME: [time]

  LOCATION: [venue]
  ```

**Contact Info:**

- Fill all relevant fields
- Each field supports multiple lines
- Preview updates in real-time

### Step 4: Customize Appearance

- Adjust colors (color picker + hex input)
- Change font sizes
- Modify positions
- Update logo size and position

### Step 5: Download

- Click "Download PNG" (default, best quality)
- Or "Download JPG" (smaller file size)
- File saves with template name

---

## 🔧 Technical Details

### Text Rendering

All text fields use `whiteSpace: "pre-wrap"` CSS property:

- Preserves line breaks from textarea
- Wraps text within width constraints
- Maintains formatting

### Image Handling

**Upload Process:**

1. User selects file via `<input type="file">`
2. FileReader API reads file as base64
3. Base64 data stored in template state
4. Next.js Image component renders preview

**URL Process:**

1. User enters URL/path
2. Stored directly in template
3. Next.js Image loads from URL
4. Must be publicly accessible

### State Management

- Template state uses deep cloning
- `updateTemplate()` function handles nested updates
- Path notation: `"branding.logo"`, `"graphics.qrCode.url"`
- Real-time preview updates

---

## 📋 Template Support Matrix

| Template           | Logo | Multi-line Text | Contact Info | QR Code |
| ------------------ | ---- | --------------- | ------------ | ------- |
| Modern Event       | ✅   | ✅              | ✅           | ❌      |
| Vibrant Promotion  | ✅   | ✅              | ✅           | ❌      |
| Elegant Service    | ✅   | ✅              | ✅           | ❌      |
| Bold Announcement  | ✅   | ✅              | ✅           | ❌      |
| Minimal Product    | ✅   | ✅              | ✅           | ❌      |
| JICF Event         | ✅   | ✅              | ✅           | ❌      |
| JICF Worship       | ✅   | ✅              | ✅           | ❌      |
| JICF Announcement  | ✅   | ✅              | ✅           | ❌      |
| Sports Event       | ✅   | ✅              | ✅           | ❌      |
| Corporate Curved   | ✅   | ✅              | ✅           | ❌      |
| **QR Code Event**  | ✅   | ✅              | ✅           | ✅      |
| Gradient Event     | ✅   | ✅              | ✅           | ❌      |
| **Detailed Event** | ✅   | ✅              | ✅           | ✅      |

---

## 💡 Best Practices

### Logo Images

- **Format:** PNG with transparency (recommended)
- **Size:** 200x200 to 500x500 pixels
- **File Size:** Under 500KB for fast loading
- **Tip:** Use square logos for best results

### QR Codes

- **Format:** PNG or SVG
- **Size:** 300x300 to 500x500 pixels
- **Background:** White for best scanning
- **Border:** Include quiet zone (white space around QR)
- **Testing:** Always test QR codes before printing

### Text Content

- **Headline:** Keep under 40 characters per line
- **Body:** Use line breaks for readability
- **Contact Info:** One item per line for clarity
- **Formatting:** Use consistent spacing

### Multi-line Formatting

```
Good Example:
DATE: October 6, 2025
TIME: 1:00 PM - 5:00 PM

LOCATION: University Sports Ground
济南大学(主校区)-西2门

Bad Example:
DATE: October 6, 2025 | TIME: 1:00 PM - 5:00 PM | LOCATION: University Sports Ground 济南大学(主校区)-西2门
```

---

## 🐛 Troubleshooting

### Logo Not Showing

- ✅ Check file was uploaded successfully
- ✅ Verify URL is publicly accessible
- ✅ Check logo size setting (increase if too small)
- ✅ Try removing and re-uploading

### QR Code Issues

- ✅ Ensure template supports QR codes
- ✅ Check QR code image quality
- ✅ Verify QR code is generated correctly
- ✅ Test scanning before using

### Text Overlapping

- ✅ Use line breaks to reduce width
- ✅ Decrease font size
- ✅ Adjust text position (Y coordinate)
- ✅ Use shorter text for headlines

### Contact Info Not Editable

- ✅ Scroll to "Contact Information & Footer" section
- ✅ All fields are Textarea inputs
- ✅ Check template has contactInfo data initialized
- ✅ Try switching templates and back

---

## 🚀 Future Enhancements

### Planned Features

- [ ] Drag-and-drop image uploads
- [ ] Click-to-upload directly on preview images
- [ ] Built-in QR code generator
- [ ] Image cropping/editing tools
- [ ] Template-specific image placeholders
- [ ] Batch image upload
- [ ] Image library/asset manager

### Component Created

- `ImageUploadWrapper` component (ready but not yet integrated)
- Provides click-to-upload functionality
- Drag-and-drop support
- Hover overlays
- Can wrap any image in the flyer

---

## 📚 Related Documentation

- [NEW_TEMPLATES_SUMMARY.md](./NEW_TEMPLATES_SUMMARY.md) - New template features
- [ENHANCEMENT_SUMMARY.md](./ENHANCEMENT_SUMMARY.md) - Dashboard improvements
- [README.md](./README.md) - Main flyer system documentation
- [REDESIGN_SUMMARY.md](./REDESIGN_SUMMARY.md) - Dashboard V2 architecture

---

## ✅ Status

**All Features Fully Functional:**

- ✅ Logo upload with preview
- ✅ QR code upload with preview
- ✅ Multi-line text editing (all fields)
- ✅ Contact info editing (all fields)
- ✅ Footer customization
- ✅ Real-time preview updates
- ✅ TypeScript compilation: ✓ No errors
- ✅ Ready for production use

**Tested With:**

- Next.js 15.5.4
- React 19.1.1
- TypeScript strict mode
- All 13 flyer templates

**Last Updated:** October 12, 2025
