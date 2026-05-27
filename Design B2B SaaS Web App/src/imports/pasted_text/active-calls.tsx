Design the remaining in-development screens for DealPilot AI, a desktop-first B2B SaaS web app for a Real-Time Voice AI Sales Engineer. These screens must visually match the already implemented app: left sidebar navigation, top header, light premium SaaS theme, 8px spacing, rounded cards, soft shadows, clear hierarchy, and the same palette: background #F8FAFC, cards #FFFFFF, text #0F172A, secondary #64748B, border #E2E8F0, primary #2563EB, AI accent #06B6D4, success #16A34A, warning #F59E0B, danger #EF4444.

Do NOT redesign the existing Dashboard, Lead Detail, Active Call Room, or Post-Call Handoff screens. Extend the product by designing these missing pages: Active Calls Page, Leads Page, Handoffs Page, Knowledge Base Page, and +New Lead Page.

GLOBAL LAYOUT
Use the same desktop app shell:
- Left sidebar: Dashboard, Active Calls, Leads, Handoffs, Knowledge Base, Settings.
- Top header: DealPilot AI logo, search, demo/workspace badge, “New Lead” button, voice engine status, avatar.
- Use Inter/Geist/SF Pro typography.
- Make all screens feel enterprise-grade, trustworthy, technical, and demo-ready.
- AI must always be clearly labeled as AI. Show rep control, grounding, approval, and safety states.

SCREEN 1 — ACTIVE CALLS PAGE
Purpose: Show all ongoing and recently active AI-assisted sales calls.

Layout:
- Page title: “Active Calls”
- Subtitle: “Monitor live AI-assisted discovery sessions and call readiness.”
- Top metric cards:
  - Live Calls
  - AI Muted
  - Avg Call Duration
  - Calls Needing Attention
- Main content: live call table/card list with:
  - Company
  - Contact
  - Industry
  - Call status: Live / AI Muted / Paused / Ending / Reconnecting
  - Duration timer
  - Current AI state: Listening / Thinking / Speaking / Muted
  - Lead score
  - Objection flag count
  - Primary action: “Open Call Room”
- Include one featured live call card for Rafael Santos / CloudCart PH, status Live, score 82, objection “Integration time concern.”
- Add right-side “Call Health” panel:
  - Voice connection: Stable
  - WebSocket: Connected
  - Knowledge base: Loaded
  - Transcript streaming: Active
  - Safety guardrail: Enabled
- Include empty state: “No active calls right now” with CTA “Start from Leads.”

SCREEN 2 — LEADS PAGE
Purpose: Full lead management workspace beyond dashboard summary.

Layout:
- Page title: “Leads”
- Subtitle: “Manage prospects before and after AI-assisted discovery calls.”
- Top filter/search row:
  - Search leads
  - Status filter
  - Industry filter
  - Score range filter
  - Sort by last call / newest / highest score
  - Button: “+ New Lead”
- Main lead table with columns:
  - Contact
  - Company
  - Industry
  - Initial Use Case
  - Status badge
  - Lead Score
  - Last Call
  - Owner/Rep
  - Actions
- Add row actions:
  - View Details
  - Start Call
  - View Handoff
- Include status variants: New Lead, In Call, SQL, Needs Review, Disqualified.
- Include bulk selection checkboxes and small bulk action bar.
- Right drawer/preview when selecting a lead:
  - Lead summary
  - Pre-call hypothesis
  - Latest extracted signals
  - Recommended next action
- Demo leads: Maya Chen / NovaStack Labs, Rafael Santos / CloudCart PH, Anika Reyes / FinOpsly.

SCREEN 3 — HANDOFFS PAGE
Purpose: Repository of generated post-call handoffs awaiting review or already approved.

Layout:
- Page title: “Handoffs”
- Subtitle: “Review CRM-ready summaries, transcripts, flagged questions, and follow-up drafts.”
- Top metric cards:
  - Generated Today
  - Awaiting Approval
  - Approved
  - Flagged Questions
- Main table/card list:
  - Company
  - Contact
  - Generated time
  - Qualification score
  - Deal stage
  - Product fit
  - Approval status: Draft / Needs Review / Approved / Exported
  - Flagged questions count
  - Actions: Review, Copy JSON, View Email Draft
- Add visual approval pipeline/tabs:
  - All
  - Needs Review
  - Approved
  - Exported
  - Flagged
- Add preview panel:
  - Handoff summary
  - Recommended next step
  - CRM JSON status
  - Email draft status
  - “Review Handoff” CTA
- Include approval safety copy: “DealPilot AI never exports CRM data or sends emails without rep approval.”

SCREEN 4 — KNOWLEDGE BASE PAGE
Purpose: Show curated product knowledge used for grounded AI answers.

Layout:
- Page title: “Knowledge Base”
- Subtitle: “Grounded product, package, objection, and discovery content used by DealPilot AI.”
- Important: This is MVP view-only or limited-edit. Do not make it look like a full admin CMS.
- Top status cards:
  - Product Catalog Loaded
  - Objection Library Loaded
  - Discovery Questions Loaded
  - Grounding Coverage
- Main tabs:
  - Product Catalog
  - Packages
  - Use Cases
  - Objections
  - Discovery Questions
  - Escalation Rules
- Product Catalog table/card list:
  - Title
  - Category
  - Source type
  - Last updated
  - Grounding status
- Objection cards:
  - Objection: “Concerned about integration time”
  - Approved response/rebuttal
  - Escalation condition
- Escalation Rules card:
  - Unknown pricing
  - SLA guarantee
  - Legal terms
  - Unsupported integration
  - Custom enterprise commitments
- Add a prominent trust panel: “AI will only answer from grounded content. Unknown questions are flagged for human follow-up.”
- Include search input: “Search knowledge base…”

SCREEN 5 — +NEW LEAD PAGE
Purpose: Create a new lead before starting a call.

Layout:
- Page title: “Create New Lead”
- Subtitle: “Add prospect context so DealPilot AI can run a better discovery call.”
- Use a clean form layout with two columns.
- Left column: Lead Information
  - Contact Name
  - Company
  - Industry
  - Email optional
  - Role/Title optional
  - Initial Use Case
  - Source
  - Priority
- Right column: AI Pre-Call Context
  - Pre-call hypothesis textarea
  - Known pain points
  - Expected technical questions
  - Budget signal dropdown
  - Urgency dropdown
  - Notes
- Add “Call Readiness Preview” card:
  - Required fields completed
  - Knowledge base ready
  - AI guardrails active
  - Prospect PII not retained unless exported
- Bottom sticky action bar:
  - Cancel
  - Save Lead
  - Save & Start Voice Sales Call
- Include validation states, required field markers, helper text, and success toast: “Lead created successfully.”

COMPONENTS TO CREATE/EXTEND
Create reusable variants for:
- Page headers
- Metric cards
- Data tables
- Status badges
- Filters
- Search bars
- Empty states
- Preview side panels
- Approval statuses
- Knowledge base cards
- Guardrail/trust cards
- Form inputs
- Dropdowns
- Textareas
- Toasts
- Sticky action bar

ACCESSIBILITY & SAFETY
Use high contrast, visible focus states, readable font sizes, labels with icons, and do not rely on color alone. Keep rep control visible. Show that AI is grounded, advisory, and approval-based. Avoid any UI implying automatic CRM export, email sending, binding commitments, pricing promises, or human impersonation.

OUTPUT
Generate polished high-fidelity desktop frames for the five missing pages. They must feel like a natural continuation of the existing DealPilot AI dashboard and support the full sales call lifecycle from lead creation to active calls, grounded knowledge, handoff review, and approval.