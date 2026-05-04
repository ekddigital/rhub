"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
} from "react";
import {
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Pin,
  CheckCircle2,
  Plus,
  Send,
  Trash2,
  Reply,
  ThumbsUp,
  HelpCircle,
  ShieldCheck,
  Star,
  Loader2,
  X,
  BookOpen,
  User,
  CreditCard,
  BedDouble,
  Building2,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QAComment {
  id: string;
  questionId: string;
  parentId: string | null;
  authorId: string | null;
  authorName: string;
  authorRole: string;
  body: string;
  isAnswer: boolean;
  upvotes: number;
  createdAt: string;
  replies: QAComment[];
}

interface QAQuestion {
  id: string;
  confEventId: string;
  authorId: string | null;
  authorName: string;
  authorRole: string;
  body: string;
  isPinned: boolean;
  isAnswered: boolean;
  isAnonymous: boolean;
  upvotes: number;
  createdAt: string;
  _count?: { comments: number };
  comments?: QAComment[];
}

interface ConfQAProps {
  confId: string;
  isManager: boolean;
  isSuperAdmin: boolean;
  currentUserName?: string;
}

// ─── Static FAQ Data ─────────────────────────────────────────────────────────

interface FAQItem {
  id: string;
  question: string;
  /** Plain-text version used for search filtering */
  searchText: string;
  /** Rich content with links shown in the expanded panel */
  answer: React.ReactNode;
}

interface FAQCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  items: FAQItem[];
}

// helper so we can keep answer as ReactNode while still searching plain text
function a(
  node: React.ReactNode,
  plain: string,
): Pick<FAQItem, "answer" | "searchText"> {
  return { answer: node, searchText: plain };
}

const L = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    className="font-medium text-[#C8A061] underline underline-offset-2 hover:text-[#C8A061]/80 transition-colors"
  >
    {children}
  </Link>
);

const STATIC_FAQ: FAQCategory[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: User,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    items: [
      {
        id: "create-account",
        question: "How do I create an account on the platform?",
        ...a(
          <>
            Visit the <L href="/login">registration page</L> and enter your full
            name, email address, and a secure password. After submitting, you
            will receive a verification email — click the confirmation link to
            activate your account. Once verified, <L href="/login">log in</L> to
            access the conference portal, view your delegate profile, and{" "}
            <L href="/tools/conf/delegates/register">
              complete your registration
            </L>
            .
          </>,
          "Visit the registration page and enter your full name, email address, and a secure password. After submitting, you will receive a verification email. Once verified, log in to complete your registration.",
        ),
      },
      {
        id: "forgot-password",
        question: "I forgot my password. How do I reset it?",
        ...a(
          <>
            Click{" "}
            <L href="/login">&ldquo;Forgot Password&rdquo; on the login page</L>{" "}
            and enter your registered email address. A password reset link will
            arrive in your inbox within a few minutes. Click the link and follow
            the prompts to set a new password. If you don&apos;t see the email,
            check your spam folder.
          </>,
          "Click Forgot Password on the login page. A reset link will arrive by email within a few minutes.",
        ),
      },
      {
        id: "update-profile",
        question: "How do I update my personal information?",
        ...a(
          <>
            There are two places where you can update your information:
            <ul className="mt-2 space-y-3 text-sm list-none">
              <li>
                <strong>Platform account</strong> (display name, profile photo)
                — after <L href="/login">logging in</L>, click your name or
                avatar in the top-right corner and go to{" "}
                <strong>Profile</strong>.
              </li>
              <li>
                <strong>Conference registration details</strong> — go to the{" "}
                <L href="/tools/conf/delegates">Delegates page</L>, find your
                name in the list, click <strong>Details</strong>, then click{" "}
                <strong>Edit Registration</strong>. You can update:
                <ul className="mt-1.5 space-y-0.5 pl-4 list-disc text-[13px] text-foreground/70">
                  <li>Full name, gender, WeChat ID, phone number</li>
                  <li>Province and city</li>
                  <li>Attendance intent, travel assistance needs</li>
                  <li>School/supervisor communication request</li>
                  <li>Year of study, LSUIC position</li>
                  <li>Foreign guest details, accommodation preference</li>
                  <li>Dietary requirements and special needs</li>
                  <li>Roommate preference and partner pairing note</li>
                  <li>
                    Documents: passport photo, entry stamp, current visa,
                    conference booklet photo
                  </li>
                </ul>
              </li>
            </ul>
            <span className="block mt-2 text-xs text-muted-foreground">
              Your email address is tied to your account — contact the committee
              via the <L href="/tools/conf/committee">Committee page</L> if you
              need it changed.
            </span>
          </>,
          "You can update platform account info (name, profile photo) via the top-right avatar menu. Conference registration details (name, gender, WeChat, phone, province, city, attendance intent, travel assistance, school communication, study year, LSUIC position, foreign guest, accommodation, dietary needs, roommate preference, documents) can be edited on the Delegates page by clicking your name, then Edit Registration.",
        ),
      },
    ],
  },
  {
    id: "registration",
    label: "Conference Registration",
    icon: BookOpen,
    color: "text-[#C8A061]",
    bg: "bg-[#C8A061]/10 border-[#C8A061]/20",
    items: [
      {
        id: "how-to-register",
        question: "How do I register as a delegate?",
        ...a(
          <>
            Go to{" "}
            <L href="/tools/conf/delegates/register">
              Conference Hub → Register
            </L>
            . Fill in your personal details, select your attendance package,
            indicate your accommodation preference, and upload a clear
            passport-sized photo. Submit your registration for committee review.
            You will be notified once approved and payment instructions will
            follow.
          </>,
          "Go to Conference Hub Register. Fill in personal details, select your attendance package, upload a photo, and submit for committee review.",
        ),
      },
      {
        id: "update-registration",
        question: "Can I update my registration details after submitting?",
        ...a(
          <>
            Yes — you can update certain fields (dietary preferences, emergency
            contact, travel details) at any time before the registration
            deadline via the <L href="/tools/conf/delegates">Delegates page</L>.
            For changes to your package or accommodation type, contact the
            conference committee directly through the{" "}
            <L href="/tools/conf/committee">Committee page</L> as these may
            affect your fee amount.
          </>,
          "You can update dietary preferences, emergency contact, and travel details before the deadline. For package or accommodation changes contact the committee.",
        ),
      },
      {
        id: "required-documents",
        question: "What information do I need to complete registration?",
        ...a(
          <>
            You will need when visiting the{" "}
            <L href="/tools/conf/delegates/register">registration form</L>:
            <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
              <li>A clear, recent passport-style photo</li>
              <li>Your valid national ID or passport number</li>
              <li>Emergency contact details</li>
              <li>Any dietary or accessibility requirements</li>
            </ul>
            <span className="block mt-2">
              All documents are stored securely and only accessible to
              authorised committee members.
            </span>
          </>,
          "You need a passport-style photo, national ID or passport number, emergency contact details, and dietary or accessibility requirements.",
        ),
      },
      {
        id: "packages",
        question:
          "What attendance packages are available and what do they include?",
        ...a(
          <>
            The conference offers packages designed for different needs (exact
            pricing shown on the{" "}
            <L href="/tools/conf/delegates/register">registration form</L>):
            <ul className="mt-2 space-y-1.5 list-disc list-inside text-sm">
              <li>
                <strong>Full Package</strong> — Accommodation (shared room), all
                meals, transport to/from the venue, and access to all sessions.
              </li>
              <li>
                <strong>Day Attendance</strong> — Access to conference sessions
                only, without accommodation or meals.
              </li>
              <li>
                <strong>Partial Package</strong> — Accommodation and select
                meals, without transport.
              </li>
            </ul>
            <span className="block mt-2">
              Contact the{" "}
              <L href="/tools/conf/finance/secretary">Financial Secretary</L>{" "}
              for payment schedule details.
            </span>
          </>,
          "Full Package includes accommodation, meals, and transport. Day Attendance is sessions only. Partial Package is accommodation and select meals. Contact the Financial Secretary for payment details.",
        ),
      },
    ],
  },
  {
    id: "accommodation",
    label: "Accommodation & Room Pairing",
    icon: BedDouble,
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
    items: [
      {
        id: "who-can-pair",
        question: "Who is eligible to choose a roommate?",
        ...a(
          <>
            Any delegate whose selected package includes accommodation is
            eligible to choose a roommate. If your package does not include
            accommodation (e.g. Day Attendance), the Room Pairing section will
            not apply to you. <L href="/login">Log in</L> and visit the{" "}
            <L href="/tools/conf/delegates">Delegates page</L> to check your
            eligibility status under the Room Pairing section.
          </>,
          "Delegates with accommodation packages can choose a roommate. Log in and visit the Delegates page to check eligibility.",
        ),
      },
      {
        id: "how-pairing-works",
        question: "How does the room pairing system work?",
        ...a(
          <>
            Visit the{" "}
            <L href="/tools/conf/delegates">Delegates page → Room Pairing</L>{" "}
            section once registered with an accommodation package. You will see
            a list of eligible delegates to send a roommate request to. When you
            send a request, the other delegate can accept or decline. Once both
            parties agree, the committee confirms and assigns the shared room.
            You can only have one active roommate pairing at a time.
          </>,
          "Visit the Delegates page Room Pairing section. Send a request to an eligible delegate. Once accepted, the committee confirms and assigns the room.",
        ),
      },
      {
        id: "same-gender-rule",
        question: "Can male and female delegates share a room?",
        ...a(
          <>
            No — by default, room assignments are same-gender only. Male
            delegates are matched with male delegates, and female delegates with
            female delegates. This policy ensures the comfort and safety of all
            attendees.
            <br />
            <br />
            The only exception is for legally recognised partners — see the{" "}
            <strong>Legal Partner Exception</strong> question below or visit the{" "}
            <L href="/tools/conf/delegates">Delegates page</L> to apply.
          </>,
          "Room assignments are same-gender only by default. The only exception is for legally recognised partners via the Legal Partner Exception.",
        ),
      },
      {
        id: "legal-partner-exception",
        question: "What is the Legal Partner Exception for room pairing?",
        ...a(
          <>
            If you and your partner are legally married or in a registered
            partnership and you are both attending the conference, you may apply
            for the Legal Partner Exception to share a room together.
            <br />
            <br />
            To apply: go to the{" "}
            <L href="/tools/conf/delegates">Delegates page → Room Pairing</L>,
            select <em>Legal Partner Exception</em> as the request type, provide
            a brief note explaining your relationship, and submit. The NEC or
            conference committee will review and confirm before the room is
            assigned. Please allow 2–5 business days for review.
          </>,
          "Legally married or registered partners may apply for the Legal Partner Exception on the Delegates page. The committee reviews within 2-5 business days.",
        ),
      },
      {
        id: "no-roommate",
        question: "What if I don't choose a roommate before the deadline?",
        ...a(
          <>
            If you have not completed a roommate pairing by the assignment
            deadline, the conference committee will assign you a roommate based
            on gender and package type. You will be notified of your room
            assignment before the conference begins. If you have any concerns
            about your assigned roommate, contact the committee through the{" "}
            <L href="/tools/conf/committee">Committee page</L> or post in the{" "}
            <strong>Community Q&amp;A</strong> tab above.
          </>,
          "Unmatched delegates are assigned a roommate by the committee based on gender and package type before the conference.",
        ),
      },
    ],
  },
  {
    id: "payments",
    label: "Payments & Fees",
    icon: CreditCard,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    items: [
      {
        id: "how-to-pay",
        question: "How do I pay my conference fees?",
        ...a(
          <>
            After your registration is approved, you will receive payment
            instructions from the financial secretary. Payment is typically made
            via bank transfer to the conference account. Once transferred,
            upload your proof of payment (bank receipt or screenshot) on the{" "}
            <L href="/tools/conf/payments">Payments page</L> under Conference
            Hub. The{" "}
            <L href="/tools/conf/finance/secretary">Financial Secretary</L> will
            review and confirm within 2–3 business days.
          </>,
          "After approval, transfer payment to the conference account and upload your proof of payment on the Payments page. The Financial Secretary confirms within 2-3 business days.",
        ),
      },
      {
        id: "payment-confirmation",
        question: "How long does payment confirmation take?",
        ...a(
          <>
            Payment confirmations are typically processed within 2–3 business
            days after proof of payment is uploaded to the{" "}
            <L href="/tools/conf/payments">Payments page</L>. During peak
            registration periods this may take slightly longer. You will receive
            a notification once confirmed. If more than 5 business days have
            passed, please follow up with the{" "}
            <L href="/tools/conf/finance/secretary">Financial Secretary</L>.
          </>,
          "Payment confirmations take 2-3 business days after uploading proof. If more than 5 days pass, follow up with the Financial Secretary.",
        ),
      },
      {
        id: "payment-receipt",
        question: "Can I get a receipt for my payment?",
        ...a(
          <>
            Yes — once your payment is confirmed, an official receipt is
            generated and available to download from the{" "}
            <L href="/tools/conf/payments">Payments page</L>. You can view your
            full payment history there at any time. If you need a formal receipt
            letter for visa or administrative purposes,{" "}
            <L href="/tools/conf/letters">contact the conference secretary</L>.
          </>,
          "Official receipts are available on the Payments page once confirmed. Contact the conference secretary for formal receipt letters.",
        ),
      },
    ],
  },
  {
    id: "general",
    label: "General Questions",
    icon: Building2,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    items: [
      {
        id: "contact",
        question: "Who do I contact if I have a problem not answered here?",
        ...a(
          <>
            Use the <strong>Community Q&amp;A</strong> tab on this page to post
            a question — committee members monitor it and will respond. For
            urgent matters, reach out via the{" "}
            <L href="/tools/conf/committee">Committee page</L> or through
            official LSUIC communication channels. Platform or technical issues
            can also be raised in Community Q&amp;A and a member with admin
            access will assist you.
          </>,
          "Use the Community Q&A tab on this page to post a question. Committee members monitor it and respond. Urgent matters can also be directed through the Committee page.",
        ),
      },
      {
        id: "important-dates",
        question: "Where can I find important conference dates and deadlines?",
        ...a(
          <>
            All key dates — registration deadlines, payment deadlines, room
            pairing deadlines, and the full conference schedule — are available
            on the{" "}
            <L href="/tools/conf/timeline">Conference Hub Timeline page</L>. The{" "}
            <L href="/tools/conf">dashboard</L> also displays a countdown to the
            conference and highlights any upcoming deadlines. Submit your
            registration and payment well before the deadlines to secure your
            place.
          </>,
          "All key dates and deadlines are on the Conference Hub Timeline page. The dashboard also shows a countdown and upcoming deadlines.",
        ),
      },
    ],
  },
];

// ─── Static FAQ Accordion ─────────────────────────────────────────────────────

function StaticFAQSection() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const searchLower = search.toLowerCase();
  const filteredCategories = STATIC_FAQ.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        (activeCategory === "all" || activeCategory === cat.id) &&
        (!search ||
          item.question.toLowerCase().includes(searchLower) ||
          item.searchText.toLowerCase().includes(searchLower)),
    ),
  })).filter((cat) => cat.items.length > 0);

  const totalCount = STATIC_FAQ.reduce((n, c) => n + c.items.length, 0);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search frequently asked questions…"
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-8 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#C8A061]/40 focus:outline-none focus:ring-1 focus:ring-[#C8A061]/30"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveCategory("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            activeCategory === "all"
              ? "bg-[#C8A061] text-white"
              : "border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({totalCount})
        </button>
        {STATIC_FAQ.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeCategory === cat.id
                ? "bg-[#C8A061] text-white"
                : "border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
            }`}
          >
            <cat.icon className="size-3" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ accordion */}
      {filteredCategories.length === 0 ? (
        <div className="rounded-xl border border-white/10 py-10 text-center">
          <HelpCircle className="mx-auto mb-2 size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No questions match your search.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Try the Community Q&amp;A tab to ask your question directly!
          </p>
        </div>
      ) : (
        filteredCategories.map((cat) => (
          <div key={cat.id} className="space-y-2">
            {activeCategory === "all" && (
              <div
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                  cat.bg
                }`}
              >
                <cat.icon className={`size-3.5 ${cat.color}`} />
                <span className={`text-xs font-bold ${cat.color}`}>
                  {cat.label}
                </span>
              </div>
            )}
            {cat.items.map((item) => {
              const isOpen = openItems.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`overflow-hidden rounded-xl border transition-all ${
                    isOpen
                      ? "border-[#C8A061]/30 bg-[#C8A061]/5"
                      : "border-white/8 bg-white/3 hover:border-white/15"
                  }`}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="flex w-full items-start justify-between gap-3 p-4 text-left"
                  >
                    <span
                      className={`text-sm font-medium leading-snug ${
                        isOpen ? "text-[#C8A061]" : "text-foreground"
                      }`}
                    >
                      {item.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="mt-0.5 size-4 shrink-0 text-[#C8A061]" />
                    ) : (
                      <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="border-t border-[#C8A061]/15 px-4 pb-4 pt-3">
                      <div className="text-sm leading-relaxed text-foreground/80">
                        {item.answer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}

      <p className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground/60">
        <HelpCircle className="size-3" />
        Can&apos;t find what you&apos;re looking for? Switch to Community
        Q&amp;A and ask the committee directly.
      </p>
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const roleUpper = role.toUpperCase();

  if (roleUpper === "SUPER_ADMIN") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-600/20 px-2 py-0.5 text-[10px] font-bold text-purple-400 ring-1 ring-purple-500/30">
        <ShieldCheck className="size-2.5" />
        Super Admin
      </span>
    );
  }
  if (roleUpper === "ADMIN") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#0B4FD9]/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 ring-1 ring-blue-500/30">
        <Star className="size-2.5" />
        Admin
      </span>
    );
  }
  if (roleUpper === "COMMITTEE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#C8A061]/20 px-2 py-0.5 text-[10px] font-bold text-[#C8A061] ring-1 ring-[#C8A061]/30">
        Committee
      </span>
    );
  }
  if (roleUpper === "DELEGATE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
        Delegate
      </span>
    );
  }
  return null;
}

// ─── Time display ─────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Comment Compose Box ──────────────────────────────────────────────────────

function CommentBox({
  placeholder,
  onSubmit,
  onCancel,
  isManager,
  submitLabel = "Post reply",
}: {
  placeholder: string;
  onSubmit: (opts: { body: string; isAnswer: boolean }) => Promise<void>;
  onCancel?: () => void;
  isManager: boolean;
  submitLabel?: string;
}) {
  const [text, setText] = useState("");
  const [markAnswer, setMarkAnswer] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await onSubmit({ body: text.trim(), isAnswer: markAnswer });
      setText("");
      setMarkAnswer(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2">
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#C8A061]/40 focus:outline-none focus:ring-1 focus:ring-[#C8A061]/30"
      />
      <div className="flex items-center gap-3">
        {isManager && (
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={markAnswer}
              onChange={(e) => setMarkAnswer(e.target.checked)}
              className="h-3 w-3 rounded accent-[#C8A061]"
            />
            Mark as official answer
          </label>
        )}
        <div className="ml-auto flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!text.trim() || busy}
            className="flex items-center gap-1.5 rounded-md bg-[#C8A061] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Send className="size-3" />
            )}
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Nested Comment Node ──────────────────────────────────────────────────────

const MAX_DEPTH = 4;

function CommentNode({
  comment,
  depth,
  confId,
  questionId,
  isManager,
  isSuperAdmin,
  currentUserId,
  onDeleted,
  onReplied,
}: {
  comment: QAComment;
  depth: number;
  confId: string;
  questionId: string;
  isManager: boolean;
  isSuperAdmin: boolean;
  currentUserId?: string;
  onDeleted: (id: string) => void;
  onReplied: (parentId: string, comment: QAComment) => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(comment.upvotes);
  const [justUpvoted, setJustUpvoted] = useState(false);
  const canDelete =
    isSuperAdmin ||
    isManager ||
    (currentUserId && comment.authorId === currentUserId);

  const handleUpvote = async () => {
    setLocalUpvotes((p) => p + 1);
    setJustUpvoted(true);
    setTimeout(() => setJustUpvoted(false), 1200);
    await fetch(`/api/conf/${confId}/qa/${questionId}/comments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId: comment.id }),
    });
  };

  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return;
    await fetch(
      `/api/conf/${confId}/qa/${questionId}/comments?commentId=${comment.id}`,
      { method: "DELETE" },
    );
    onDeleted(comment.id);
  };

  const handleReply = async ({
    body,
    isAnswer,
  }: {
    body: string;
    isAnswer: boolean;
  }) => {
    const res = await fetch(`/api/conf/${confId}/qa/${questionId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, parentId: comment.id, isAnswer }),
    });
    if (!res.ok) throw new Error("Failed");
    const newComment = (await res.json()) as QAComment;
    newComment.replies = [];
    onReplied(comment.id, newComment);
    setShowReply(false);
  };

  return (
    <div
      className={`relative ${depth > 0 ? "ml-4 border-l-2 border-white/10 pl-3" : ""}`}
    >
      {/* Comment bubble */}
      <div
        className={`rounded-lg p-3 ${
          comment.isAnswer
            ? "border border-[#C8A061]/30 bg-[#C8A061]/10"
            : "bg-white/4"
        } mb-2`}
      >
        {/* Header row */}
        <div className="mb-1.5 flex items-center gap-2 flex-wrap">
          {comment.isAnswer && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#C8A061]/20 px-2 py-0.5 text-[10px] font-bold text-[#C8A061]">
              <CheckCircle2 className="size-2.5" />
              Official Answer
            </span>
          )}
          <span className="text-xs font-semibold">{comment.authorName}</span>
          <RoleBadge role={comment.authorRole} />
          <span className="text-[11px] text-muted-foreground">
            {timeAgo(comment.createdAt)}
          </span>
          <div className="ml-auto flex items-center gap-1">
            {canDelete && (
              <button
                onClick={handleDelete}
                className="rounded p-1 text-muted-foreground hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <p className="text-sm leading-relaxed text-foreground/90">
          {comment.body}
        </p>

        {/* Actions */}
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={handleUpvote}
            className={`flex items-center gap-1 text-[11px] transition-colors ${
              justUpvoted
                ? "text-[#C8A061]"
                : "text-muted-foreground hover:text-[#C8A061]"
            }`}
          >
            <ThumbsUp
              className={`size-3 ${justUpvoted ? "fill-current" : ""}`}
            />
            {localUpvotes > 0 ? localUpvotes : "Like"}
          </button>
          {depth < MAX_DEPTH && (
            <button
              onClick={() => setShowReply((p) => !p)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Reply className="size-3" />
              Reply
            </button>
          )}
          {comment.replies.length > 0 && (
            <button
              onClick={() => setCollapsed((p) => !p)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              {collapsed ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronUp className="size-3" />
              )}
              {collapsed
                ? `Show ${comment.replies.length} repl${comment.replies.length === 1 ? "y" : "ies"}`
                : "Collapse"}
            </button>
          )}
        </div>
      </div>

      {/* Reply compose */}
      {showReply && (
        <div className="ml-4 mb-3">
          <CommentBox
            placeholder={`Reply to ${comment.authorName}…`}
            onSubmit={handleReply}
            onCancel={() => setShowReply(false)}
            isManager={isManager}
            submitLabel="Post reply"
          />
        </div>
      )}

      {/* Nested replies */}
      {!collapsed && comment.replies.length > 0 && (
        <div className="mt-1">
          {comment.replies.map((child) => (
            <CommentNode
              key={child.id}
              comment={child}
              depth={depth + 1}
              confId={confId}
              questionId={questionId}
              isManager={isManager}
              isSuperAdmin={isSuperAdmin}
              currentUserId={currentUserId}
              onDeleted={onDeleted}
              onReplied={onReplied}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Delete a comment from a nested tree ──────────────────────────────────────

function deleteFromTree(comments: QAComment[], id: string): QAComment[] {
  return comments
    .filter((c) => c.id !== id)
    .map((c) => ({ ...c, replies: deleteFromTree(c.replies, id) }));
}

function insertReply(
  comments: QAComment[],
  parentId: string,
  newComment: QAComment,
): QAComment[] {
  return comments.map((c) => {
    if (c.id === parentId) {
      return { ...c, replies: [...c.replies, newComment] };
    }
    return { ...c, replies: insertReply(c.replies, parentId, newComment) };
  });
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  confId,
  isManager,
  isSuperAdmin,
  currentUserId,
  onDelete,
  onPatch,
}: {
  question: QAQuestion;
  confId: string;
  isManager: boolean;
  isSuperAdmin: boolean;
  currentUserId?: string;
  onDelete: (id: string) => void;
  onPatch: (id: string, patch: Partial<QAQuestion>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<QAComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentCount, setCommentCount] = useState(
    question._count?.comments ?? 0,
  );
  const [localUpvotes, setLocalUpvotes] = useState(question.upvotes);
  const [justUpvoted, setJustUpvoted] = useState(false);

  const handleUpvote = async () => {
    setLocalUpvotes((p) => p + 1);
    setJustUpvoted(true);
    setTimeout(() => setJustUpvoted(false), 1200);
    await fetch(`/api/conf/${confId}/qa/${question.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upvote" }),
    });
  };

  const loadComments = useCallback(async () => {
    if (loadingComments) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/conf/${confId}/qa/${question.id}`);
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as QAQuestion;
      setComments(data.comments ?? []);
    } finally {
      setLoadingComments(false);
    }
  }, [confId, question.id, loadingComments]);

  const handleExpand = async () => {
    if (!expanded) {
      await loadComments();
    }
    setExpanded((p) => !p);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this question and all its replies?")) return;
    await fetch(`/api/conf/${confId}/qa/${question.id}`, { method: "DELETE" });
    onDelete(question.id);
  };

  const handlePin = async () => {
    const res = await fetch(`/api/conf/${confId}/qa/${question.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !question.isPinned }),
    });
    if (res.ok) {
      const updated = (await res.json()) as QAQuestion;
      onPatch(question.id, { isPinned: updated.isPinned });
    }
  };

  const handleMarkAnswered = async () => {
    const res = await fetch(`/api/conf/${confId}/qa/${question.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAnswered: !question.isAnswered }),
    });
    if (res.ok) {
      const updated = (await res.json()) as QAQuestion;
      onPatch(question.id, { isAnswered: updated.isAnswered });
    }
  };

  const handleAddComment = async ({
    body,
    isAnswer,
  }: {
    body: string;
    isAnswer: boolean;
  }) => {
    const res = await fetch(`/api/conf/${confId}/qa/${question.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, isAnswer }),
    });
    if (!res.ok) throw new Error("Failed");
    const newComment = (await res.json()) as QAComment;
    newComment.replies = [];
    setComments((prev) => [...prev, newComment]);
    setCommentCount((p) => p + 1);
    if (isAnswer) onPatch(question.id, { isAnswered: true });
    setShowCommentBox(false);
    if (!expanded) {
      setExpanded(true);
    }
  };

  const handleCommentDeleted = (deletedId: string) => {
    setComments((prev) => deleteFromTree(prev, deletedId));
    setCommentCount((p) => Math.max(0, p - 1));
  };

  const handleCommentReplied = (parentId: string, newComment: QAComment) => {
    setComments((prev) => insertReply(prev, parentId, newComment));
    setCommentCount((p) => p + 1);
  };

  const canDelete =
    isSuperAdmin ||
    isManager ||
    (currentUserId && question.authorId === currentUserId);

  return (
    <div
      className={`rounded-xl border transition-colors ${
        question.isPinned
          ? "border-[#C8A061]/40 bg-[#C8A061]/5"
          : question.isAnswered
            ? "border-emerald-500/25 bg-emerald-950/10"
            : "border-white/10 bg-white/3"
      }`}
    >
      {/* Question Header */}
      <div className="p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {question.isPinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#C8A061]/20 px-2 py-0.5 text-[10px] font-bold text-[#C8A061]">
              <Pin className="size-2.5" />
              Pinned
            </span>
          )}
          {question.isAnswered && (
            <Badge
              variant="outline"
              className="border-emerald-500/40 text-xs text-emerald-400"
            >
              <CheckCircle2 className="mr-1 size-3" />
              Answered
            </Badge>
          )}
          <span className="text-xs font-semibold">{question.authorName}</span>
          <RoleBadge role={question.authorRole} />
          <span className="text-[11px] text-muted-foreground">
            {timeAgo(question.createdAt)}
          </span>

          {/* Admin controls */}
          {(isManager || isSuperAdmin) && (
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={handlePin}
                title={question.isPinned ? "Unpin" : "Pin to FAQ"}
                className="rounded p-1 text-muted-foreground hover:text-[#C8A061]"
              >
                <Pin className="size-3.5" />
              </button>
              <button
                onClick={handleMarkAnswered}
                title={
                  question.isAnswered ? "Mark unanswered" : "Mark answered"
                }
                className="rounded p-1 text-muted-foreground hover:text-emerald-400"
              >
                <CheckCircle2 className="size-3.5" />
              </button>
              {canDelete && (
                <button
                  onClick={handleDelete}
                  title="Delete question"
                  className="rounded p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          )}
          {!isManager && !isSuperAdmin && canDelete && (
            <button
              onClick={handleDelete}
              title="Delete question"
              className="ml-auto rounded p-1 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>

        <p className="text-sm leading-relaxed">{question.body}</p>

        {/* Footer actions */}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleExpand}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="size-3.5" />
            {commentCount > 0
              ? `${commentCount} comment${commentCount === 1 ? "" : "s"}`
              : "No comments yet"}
            {loadingComments ? (
              <Loader2 className="size-3 animate-spin" />
            ) : expanded ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
          </button>

          <button
            onClick={() => {
              setShowCommentBox((p) => !p);
              if (!expanded && !showCommentBox) {
                void loadComments().then(() => setExpanded(true));
              }
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Reply className="size-3.5" />
            {isManager ? "Answer / Reply" : "Reply"}
          </button>

          <button
            onClick={handleUpvote}
            className={`ml-auto flex items-center gap-1.5 text-xs transition-colors ${
              justUpvoted
                ? "font-semibold text-[#C8A061]"
                : "text-muted-foreground hover:text-[#C8A061]"
            }`}
          >
            <ThumbsUp
              className={`size-3.5 ${justUpvoted ? "fill-current" : ""}`}
            />
            {localUpvotes > 0 ? localUpvotes : "Like"}
            {justUpvoted && <span className="text-[10px] opacity-80"> +1</span>}
          </button>
        </div>
      </div>

      {/* Reply compose */}
      {showCommentBox && (
        <div className="border-t border-white/8 px-4 pb-4 pt-3">
          <CommentBox
            placeholder={
              isManager ? "Write your answer or reply…" : "Write a reply…"
            }
            onSubmit={handleAddComment}
            onCancel={() => setShowCommentBox(false)}
            isManager={isManager}
            submitLabel={isManager ? "Post answer" : "Post reply"}
          />
        </div>
      )}

      {/* Comments section */}
      {expanded && (
        <div className="border-t border-white/8 px-4 pb-4 pt-3">
          {loadingComments && comments.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Loading comments…
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No comments yet. Be the first to reply!
            </p>
          ) : (
            <div className="space-y-1">
              {comments.map((comment) => (
                <CommentNode
                  key={comment.id}
                  comment={comment}
                  depth={0}
                  confId={confId}
                  questionId={question.id}
                  isManager={isManager}
                  isSuperAdmin={isSuperAdmin}
                  currentUserId={currentUserId}
                  onDeleted={handleCommentDeleted}
                  onReplied={handleCommentReplied}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ConfQA({
  confId,
  isManager,
  isSuperAdmin,
  currentUserName,
}: ConfQAProps) {
  const [mainTab, setMainTab] = useState<"faq" | "qa">("faq");
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAskForm, setShowAskForm] = useState(false);
  const [askText, setAskText] = useState("");
  const [askAnonymous, setAskAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "faq" | "unanswered">(
    "all",
  );

  const loadQuestions = useCallback(async () => {
    if (!confId) return;
    try {
      const res = await fetch(`/api/conf/${confId}/qa`);
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as QAQuestion[];
      setQuestions(data);
    } catch {
      // Silently fail; DB may be unavailable
    } finally {
      setLoading(false);
    }
  }, [confId]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const handleAsk = async (e: FormEvent) => {
    e.preventDefault();
    const body = askText.trim();
    if (!body) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/conf/${confId}/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          isAnonymous: askAnonymous,
          authorName: askAnonymous
            ? "Anonymous"
            : (currentUserName ?? "Member"),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const newQuestion = (await res.json()) as QAQuestion;
      newQuestion._count = { comments: 0 };
      setQuestions((prev) => [newQuestion, ...prev]);
      setAskText("");
      setAskAnonymous(false);
      setShowAskForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handlePatch = (id: string, patch: Partial<QAQuestion>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    );
  };

  const pinnedQuestions = questions.filter((q) => q.isPinned);
  const unansweredQuestions = questions.filter(
    (q) => !q.isPinned && !q.isAnswered,
  );
  const allQuestions = questions.filter((q) => !q.isPinned);

  const tabQuestions =
    activeTab === "faq"
      ? pinnedQuestions
      : activeTab === "unanswered"
        ? unansweredQuestions
        : allQuestions;

  return (
    <Card className="border-white/10">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="size-5 text-[#C8A061]" />
            Help &amp; FAQ
          </CardTitle>

          {mainTab === "qa" && (
            <button
              onClick={() => setShowAskForm((p) => !p)}
              className="flex items-center gap-1.5 rounded-lg bg-[#C8A061] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              {showAskForm ? (
                <>
                  <X className="size-3.5" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  Ask a question
                </>
              )}
            </button>
          )}
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          Browse answers to common questions, or ask the community anything
          about the conference.
        </p>

        {/* Main tab switcher */}
        <div className="mt-3 flex items-center gap-1 rounded-lg border border-white/10 bg-white/3 p-1">
          <button
            onClick={() => setMainTab("faq")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mainTab === "faq"
                ? "bg-[#C8A061] text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="size-3.5" />
            FAQ
          </button>
          <button
            onClick={() => setMainTab("qa")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mainTab === "qa"
                ? "bg-[#C8A061] text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageCircle className="size-3.5" />
            Community Q&amp;A
            {!loading && unansweredQuestions.length > 0 && (
              <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {unansweredQuestions.length}
              </span>
            )}
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {mainTab === "faq" ? (
          <StaticFAQSection />
        ) : (
          <div className="space-y-4">
            {/* Ask form */}
            {showAskForm && (
              <div className="rounded-xl border border-[#C8A061]/30 bg-[#C8A061]/5 p-4">
                <p className="mb-2 text-xs font-semibold text-[#C8A061]">
                  Ask a new question
                </p>
                <form onSubmit={handleAsk} className="flex flex-col gap-2">
                  <textarea
                    value={askText}
                    onChange={(e) => setAskText(e.target.value)}
                    placeholder="What would you like to know about the conference?"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#C8A061]/40 focus:outline-none focus:ring-1 focus:ring-[#C8A061]/30"
                  />
                  <div className="flex items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={askAnonymous}
                        onChange={(e) => setAskAnonymous(e.target.checked)}
                        className="h-3 w-3 rounded accent-[#C8A061]"
                      />
                      Ask anonymously
                    </label>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAskForm(false)}
                        className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!askText.trim() || submitting}
                        className="flex items-center gap-1.5 rounded-md bg-[#C8A061] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                      >
                        {submitting ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Send className="size-3" />
                        )}
                        Post question
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Pinned FAQ quick section */}
            {pinnedQuestions.length > 0 && (
              <div className="rounded-xl border border-[#C8A061]/20 bg-[#C8A061]/4 p-4">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-bold text-[#C8A061]">
                  <Pin className="size-3.5" />
                  Frequently Asked Questions
                </p>
                <div className="space-y-3">
                  {pinnedQuestions.map((q) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      confId={confId}
                      isManager={isManager}
                      isSuperAdmin={isSuperAdmin}
                      onDelete={handleDelete}
                      onPatch={handlePatch}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tab bar */}
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/3 p-1">
              {(
                [
                  { key: "all", label: `All (${allQuestions.length})` },
                  {
                    key: "unanswered",
                    label: `Unanswered (${unansweredQuestions.length})`,
                  },
                  ...(pinnedQuestions.length > 0
                    ? [{ key: "faq", label: `FAQ (${pinnedQuestions.length})` }]
                    : []),
                ] as { key: "all" | "faq" | "unanswered"; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-[#C8A061] text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Questions list */}
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading questions…
              </div>
            ) : tabQuestions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <MessageCircle className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {activeTab === "unanswered"
                    ? "All questions have been answered!"
                    : "No questions yet. Be the first to ask!"}
                </p>
                {!showAskForm && (
                  <button
                    onClick={() => setShowAskForm(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-[#C8A061]/40 px-3 py-1.5 text-xs font-semibold text-[#C8A061] hover:bg-[#C8A061]/10"
                  >
                    <Plus className="size-3.5" />
                    Ask a question
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {tabQuestions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    confId={confId}
                    isManager={isManager}
                    isSuperAdmin={isSuperAdmin}
                    onDelete={handleDelete}
                    onPatch={handlePatch}
                  />
                ))}
              </div>
            )}

            {/* Upvote hint */}
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              <ThumbsUp className="size-3" />
              Committee members and leaders can pin questions or mark official
              answers
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
