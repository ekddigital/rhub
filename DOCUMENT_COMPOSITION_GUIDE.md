# Document Composition System - Implementation Guide

## Overview

The document composition system allows you to reuse the letter preview system across multiple pages (Payments, Budget, etc.) so that as users edit data, they see a live preview of the formal document.

## Architecture

### Components

1. **PaymentLetterComposer** - Shows payment receipt preview
   - Location: `src/components/tools/conf/payment-letter-composer.tsx`
   - Displays formatted payment receipt with amount, payer, date, status
   - Can be added as a side panel to payment forms

2. **BudgetLetterComposer** - Shows budget proposal preview
   - Location: `src/components/tools/conf/budget-letter-composer.tsx`
   - Displays formatted budget table with line items and totals
   - Can be added as a side panel to budget forms

3. **useDocumentComposition** - State management hook
   - Location: `src/hooks/useDocumentComposition.ts`
   - Manages drafts, auto-save, localStorage persistence
   - Handles 800ms debounce for auto-save

4. **useDocumentSignatories** - Signatory management hook
   - Location: `src/hooks/useDocumentSignatories.ts`
   - Manages up to 3 signatories with presets (STANDARD, FUNDRAISING, CUSTOM)
   - Handles signature uploads and scaling

## Usage Examples

### Adding Payment Receipt Preview to Payment Page

```tsx
'use client';

import { useState } from 'react';
import { PaymentLetterComposer } from '@/components/tools/conf/payment-letter-composer';
import { PaymentShellV2 } from '@/components/tools/conf/payment-shell-v2';

export default function PaymentPage() {
  const [showPreview, setShowPreview] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPayment, setCurrentPayment] = useState({
    id: 'P001',
    amount: 250.00,
    paidBy: 'Delegate Name',
    paidTo: 'LSUIC Conference',
    method: 'WeChat Pay',
    date: new Date().toLocaleDateString(),
    description: 'Conference delegate fee',
    status: 'APPROVED',
  });

  return (
    <div className="flex">
      <div className="flex-1">
        <PaymentShellV2 />
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      <PaymentLetterComposer
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        paymentData={currentPayment}
      />
    </div>
  );
}
```

### Adding Budget Proposal Preview to Budget Page

```tsx
'use client';

import { useState } from 'react';
import { BudgetLetterComposer } from '@/components/tools/conf/budget-letter-composer';
import { BudgetShell } from '@/components/tools/conf/budget-shell';

export default function BudgetPage() {
  const [showPreview, setShowPreview] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [budgetData, setBudgetData] = useState({
    id: 'B001',
    title: 'Conference Venue & Catering',
    status: 'DRAFT',
    createdBy: 'Finance Secretary',
    date: new Date().toLocaleDateString(),
    items: [
      {
        name: 'Hotel Accommodation',
        category: 'VENUE',
        qty: 3,
        unit: 'nights',
        unitPrice: 150.00,
        total: 450.00,
      },
      {
        name: 'Meal Services',
        category: 'FOOD',
        qty: 100,
        unit: 'persons',
        unitPrice: 25.00,
        total: 2500.00,
      },
    ],
  });

  return (
    <div className="flex">
      <div className="flex-1">
        <BudgetShell />
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      <BudgetLetterComposer
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        budgetData={budgetData}
      />
    </div>
  );
}
```

## Features

### Live Preview
- As you edit payment/budget data, the preview updates immediately
- No manual refresh needed
- Zoom in/out for better visibility

### Export & Print
- Print button: Opens browser print dialog for PDF creation
- Download button: Saves as PDF file
- Formatted for A4 paper size

### Auto-Save (With useDocumentComposition)
- 800ms debounce before saving
- Automatic localStorage persistence
- Can be toggled with `autoSaveToLocalStorage` option

### Responsive Design
- Fixed side panel (96px width)
- Works alongside existing forms
- Smooth open/close animations

## Component Props

### PaymentLetterComposerProps

```typescript
interface PaymentLetterComposerProps {
  isOpen: boolean;                    // Show/hide preview
  onClose: () => void;                // Close handler
  zoomLevel: number;                  // 50-200%
  onZoomChange: (level: number) => void;  // Zoom change handler
  paymentData?: {
    id: string;
    amount: number;
    paidBy: string;
    paidTo: string;
    method: string;
    date: string;
    description: string;
    status: string;
  };
  members?: Array<{id; name; role; phone}>;  // For committee roster
  confInfo?: {startsAt; endsAt; venue};     // Conference details
}
```

### BudgetLetterComposerProps

```typescript
interface BudgetLetterComposerProps {
  isOpen: boolean;
  onClose: () => void;
  zoomLevel: number;
  onZoomChange: (level: number) => void;
  budgetData?: {
    id: string;
    title: string;
    status: string;
    createdBy: string;
    date: string;
    items: BudgetLineItem[];
  };
}

interface BudgetLineItem {
  name: string;
  category: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
}
```

## Integration Points

### Payments Route
**File**: `src/app/(hub)/tools/conf/payments/page.tsx`

Current: Shows list of payments in a table
New: Add PaymentLetterComposer side panel that shows receipt for selected payment

### Budget Route
**File**: `src/app/(hub)/tools/conf/budget/page.tsx`

Current: Shows budget draft form with line items
New: Add BudgetLetterComposer side panel that updates as items are added/edited

### Letter Route
**File**: `src/app/(hub)/tools/conf/letters/page.tsx`

No changes needed - existing letter composer continues to work independently

## Modular Design

### Benefits
- ✅ Reusable across any page
- ✅ Self-contained (brings own styling/functionality)
- ✅ No dependencies on main form component
- ✅ Easy to add/remove without affecting existing logic
- ✅ Zoom & print controls built-in

### Extensibility
- Can add more composers for Reports, Invoices, etc.
- Same pattern: `{Type}LetterComposer` components
- Use `useDocumentComposition` hook for state management
- Can integrate with existing signature/signatory system

## Next Steps

1. Integrate `PaymentLetterComposer` into payments page
2. Integrate `BudgetLetterComposer` into budget page
3. Update data binding so composer receives live updates
4. Connect signature system if needed
5. Add export to database (save as ConfLetter record)

## Notes

- Composers use inline HTML rendering for preview (not LetterA4Preview)
- A4 sizing: 210mm × 297mm
- Zoom transform applied to container (client-side visual only)
- Print uses CSS media queries and `print:block` class
- All styling uses Tailwind + inline styles for portability
