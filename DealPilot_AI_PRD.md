# DealPilot AI — Product Requirements Document

> **Real-Time Voice AI Sales Engineer for B2B Software Calls**

---

## Table of Contents

1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [Solution](#solution)
4. [The Golden Rule — What AI Will Not Do](#the-golden-rule--what-ai-will-not-do)
5. [User Personas](#user-personas)
6. [Core User Journeys](#core-user-journeys)
7. [Feature Specification](#feature-specification)
8. [System Architecture](#system-architecture)
9. [Infrastructure Design](#infrastructure-design)
10. [Data Models](#data-models)
11. [API Contracts](#api-contracts)
12. [AI Agent Design](#ai-agent-design)
13. [Non-Functional Requirements](#non-functional-requirements)
14. [Out of Scope (MVP)](#out-of-scope-mvp)
15. [Success Metrics](#success-metrics)

---

## Overview

**Product Name:** DealPilot AI
**Type:** Real-time Voice AI Sales Engineer
**Target Market:** B2B SaaS, API companies, cloud platforms, and developer-tool companies
**Core Value Prop:** An AI agent that joins live discovery calls, qualifies prospects through voice conversation, answers technical/product questions, and generates a CRM-ready handoff — without needing a human sales engineer on every call.

---

## Problem Statement

B2B software sales consistently breaks at the technical discovery phase:

- Prospects ask technical questions that generalist sales reps cannot confidently answer
- Sales engineers are expensive, scarce, and create scheduling bottlenecks
- Missed technical signals during calls lead to poor qualification and bad pipeline data
- Post-call notes are inconsistent, incomplete, or never logged into the CRM
- Follow-up emails are generic and slow

**The result:** Qualified opportunities are lost, and pipeline data is unreliable.

---

## Solution

DealPilot AI functions as an always-available AI Sales Engineer that:

1. **Joins a voice call** as a named AI participant
2. **Conducts structured discovery** using dynamic, context-aware questions
3. **Answers product and technical questions** from a curated knowledge base
4. **Handles objections** with trained rebuttals
5. **Recommends the right solution package** based on extracted context
6. **Scores lead quality** in real time
7. **Generates a complete sales handoff** — transcript, lead score, CRM CSV, and follow-up email draft

---

## The Golden Rule — What AI Will Not Do

> These constraints are non-negotiable. They exist to keep the product trustworthy, legally safe, and demo-stable. Any feature request that violates these rules must be rejected or redesigned.

### 🚫 Rule 1 — The AI Will Not Fabricate Product Information
The AI agent must only answer product and technical questions using content explicitly present in the loaded knowledge base. If a question falls outside the knowledge base scope, the AI must flag it for human follow-up. It must never hallucinate pricing, features, SLAs, or integration capabilities.

**Enforcement:** All product Q&A responses are retrieved via a structured retrieval layer (RAG), not generated freely. Any response lacking a grounding source triggers the handoff phrase:
> *"That's a great technical question — I'll flag this for our human sales engineer in the follow-up."*

---

### 🚫 Rule 2 — The AI Will Not Impersonate a Human
The AI must never deny being an AI when directly asked. It may have a persona name (e.g., "DealPilot AI" or "Alex from DealPilot"), but it must acknowledge its nature if challenged. It will not use deception to build rapport.

---

### 🚫 Rule 3 — The AI Will Not Make Binding Commitments
The AI will not promise specific pricing, contract terms, delivery dates, SLA guarantees, or legal commitments. It may recommend packages and estimate implementation complexity, but all commitments require human confirmation.

---

### 🚫 Rule 4 — The AI Will Not Store or Log PII Beyond Session Scope
The AI will not retain prospect personal data (name, email, phone, company details) beyond the active session unless explicitly exported by the sales rep. No persistent user profiles are built on prospects without consent.

---

### 🚫 Rule 5 — The AI Will Not Override the Sales Rep
The sales rep retains full control at all times. The AI can be muted, paused, or terminated by the rep at any point. The AI must never talk over the rep, interrupt the prospect mid-sentence (unless silence timeout is triggered), or take autonomous action outside the call context (e.g., sending emails, creating CRM entries without rep approval).

---

### 🚫 Rule 6 — The AI Will Not Score Leads Punitively
Lead scoring is additive and advisory. The AI will not disqualify a lead or tell a prospect they are "not a fit." Disqualification decisions belong to the sales rep.

---

## User Personas

### Persona A — The Sales Rep / Account Executive
| Attribute | Detail |
|-----------|--------|
| Role | B2B SaaS Account Executive |
| Goal | Run more discovery calls without needing a sales engineer |
| Pain | Loses technical prospects when they ask SDK/API/integration questions |
| Behavior | Manages a lead list, starts calls, monitors live extracted data, reviews handoff |
| Success | More SQLs per week, consistent CRM data, faster follow-up |

### Persona B — The Prospect / Potential Buyer
| Attribute | Detail |
|-----------|--------|
| Role | CTO, Head of Product, or Technical Lead at a growing company |
| Goal | Evaluate whether the product solves their technical problem |
| Pain | Hates generic demos that don't answer their real questions |
| Behavior | Speaks naturally, asks follow-up questions, expects specificity |
| Success | Feels heard, gets a relevant recommendation, agrees to next step |

---

## Core User Journeys

### Journey 1 — Sales Rep Starts an AI-Assisted Discovery Call

```
Rep opens Dashboard
  → Sees lead list with company, contact, use case, status
  → Selects a lead
  → Views pre-loaded lead context (industry, initial use case hypothesis)
  → Clicks [Start Voice Sales Call]
  → AI joins the call as "DealPilot AI"
  → Rep monitors live panel (extracted fields update in real time)
  → Call ends
  → Rep reviews post-call handoff
  → Rep approves and exports CRM CSV / follow-up email
```

### Journey 2 — Prospect Experience During Call

```
Prospect receives or joins a voice call
  → Hears AI introduce itself
  → Answers discovery questions naturally by voice
  → Asks technical/product questions
  → Receives clear, grounded answers or honest escalation
  → Hears a package recommendation
  → Agrees to a next step
  → Call ends (no further friction required from prospect)
```

### Journey 3 — Post-Call Handoff Review

```
Call ends
  → System generates: transcript, lead score, CRM CSV, follow-up email draft
  → Rep reviews each output section
  → Rep edits if needed
  → Rep exports JSON to CRM or sends email draft
```

---

## Feature Specification

### F1 — Lead Management Dashboard

| ID | Feature | Priority |
|----|---------|----------|
| F1.1 | Display lead list (name, company, industry, use case, status) | P0 |
| F1.2 | Lead detail view (pre-call context) | P0 |
| F1.3 | Lead status badge (New Lead → In Call → SQL → Disqualified) | P0 |
| F1.4 | Manual lead creation (name, company, initial use case) | P1 |

---

### F2 — Voice Call Interface

| ID | Feature | Priority |
|----|---------|----------|
| F2.1 | Start / End call controls | P0 |
| F2.2 | Live audio stream (prospect mic → AI processing) | P0 |
| F2.3 | AI voice response playback | P0 |
| F2.4 | Live scrolling transcript (speaker-labeled) | P0 |
| F2.5 | Mute AI toggle (rep can silence AI mid-call) | P0 |
| F2.6 | Call duration timer | P1 |

---

### F3 — Real-Time Sales Copilot Panel

| ID | Feature | Priority |
|----|---------|----------|
| F3.1 | Live field extraction display (see Data Models) | P0 |
| F3.2 | Fields animate/highlight when newly populated | P1 |
| F3.3 | Objection flag indicator | P0 |
| F3.4 | Live lead score gauge (0–100) | P0 |
| F3.5 | Recommended package display | P0 |
| F3.6 | Rep override input (rep can type corrections to extracted fields) | P1 |

---

### F4 — AI Sales Agent Capabilities

| ID | Capability | Priority |
|----|------------|----------|
| F4.1 | Dynamic discovery question sequencing | P0 |
| F4.2 | Product Q&A via knowledge base RAG | P0 |
| F4.3 | Objection handling from trained response set | P0 |
| F4.4 | Solution package recommendation | P0 |
| F4.5 | Next-step closing question | P0 |
| F4.6 | Graceful escalation for out-of-scope questions | P0 |
| F4.7 | Lead qualification scoring (rule-based + LLM) | P0 |

---

### F5 — Post-Call Handoff Generation

| ID | Output | Priority |
|----|--------|----------|
| F5.1 | Full call transcript (timestamped, speaker-labeled) | P0 |
| F5.2 | Lead qualification summary card | P0 |
| F5.3 | CRM-ready CSV export | P0 |
| F5.4 | Follow-up email draft | P0 |
| F5.5 | Flagged unanswered questions list | P1 |

---

### F6 — Product Knowledge Base

| ID | Feature | Priority |
|----|---------|----------|
| F6.1 | Static product catalog (packages, use cases, features) | P0 |
| F6.2 | Embedding-based semantic retrieval (RAG) | P0 |
| F6.3 | Objection → rebuttal lookup table | P0 |
| F6.4 | Admin UI to update knowledge base entries | P2 |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│   ┌──────────────────┐          ┌──────────────────────────┐   │
│   │  Sales Rep UI    │          │   Prospect Voice Client  │   │
│   │  (React + Vite)  │          │   (Browser / SDK)        │   │
│   │                  │          │                          │   │
│   │  • Lead Dashboard│          │  • Joins voice session   │   │
│   │  • Call Monitor  │          │  • Speaks naturally      │   │
│   │  • Copilot Panel │          │  • Hears AI responses    │   │
│   │  • Handoff View  │          │                          │   │
│   └────────┬─────────┘          └────────────┬─────────────┘   │
│            │ WebSocket                        │ WebRTC / Voice  │
└────────────┼──────────────────────────────────┼─────────────────┘
             │                                  │
┌────────────▼──────────────────────────────────▼─────────────────┐
│                        API GATEWAY                               │
│              (Node.js / Express or FastAPI)                      │
│                                                                  │
│   REST endpoints for lead CRUD, session init, handoff export     │
│   WebSocket server for real-time transcript + field streaming    │
└──────┬────────────────────────┬────────────────────────┬─────────┘
       │                        │                        │
┌──────▼──────┐     ┌───────────▼────────┐    ┌─────────▼──────────┐
│  Voice      │     │  AI Orchestration  │    │  Data Store        │
│  Pipeline   │     │  Engine            │    │                    │
│             │     │                    │    │  • Leads DB        │
│  • STT      │────▶│  • LLM (Claude /   │    │    (Postgres /     │
│  • TTS      │     │    GPT-4o)         │    │     SQLite)        │
│  • Voice I/O│     │  • RAG Retrieval   │    │  • Embeddings      │
│  (Agora SDK │     │  • Prompt Router   │    │    (pgvector /     │
│  or WebRTC) │     │  • Field Extractor │    │     Chroma)        │
│             │     │  • Scorer          │    │  • Session logs    │
└─────────────┘     └────────────────────┘    └────────────────────┘
```

---

## Infrastructure Design

### Stack Decisions

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React + Vite + TypeScript | Fast dev, component-friendly for live panels |
| Styling | Tailwind CSS | Rapid iteration, consistent design tokens |
| Backend | Node.js + Express (or Python FastAPI) | Either works; pick based on team fluency |
| Real-time comms | WebSocket (Socket.io) | Live transcript and field streaming to rep UI |
| Voice I/O | Agora RTC SDK or browser WebRTC | Sponsor-aligned; proven for low-latency voice |
| STT | Deepgram / AssemblyAI real-time streaming | Best-in-class accuracy + streaming support |
| TTS | ElevenLabs / OpenAI TTS | Natural voice output for AI responses |
| LLM | Anthropic Claude (claude-sonnet) | Strong instruction-following and JSON extraction |
| RAG / Embeddings | OpenAI `text-embedding-3-small` + Chroma or pgvector | Fast local retrieval for hackathon scope |
| Database | SQLite (dev) → PostgreSQL (prod) | Simple for MVP; upgradeable |
| Hosting | Render / Railway / Vercel (frontend) | One-command deploy; free tiers available |
| Environment | `.env` per service | Secrets never hardcoded |

---

### Directory Structure

```
dealpilot-ai/
│
├── apps/
│   ├── web/                          # React frontend
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx     # Lead list view
│   │   │   │   ├── CallRoom.tsx      # Active call screen
│   │   │   │   └── Handoff.tsx       # Post-call output
│   │   │   ├── components/
│   │   │   │   ├── LeadCard.tsx
│   │   │   │   ├── CopilotPanel.tsx  # Live field extraction display
│   │   │   │   ├── Transcript.tsx    # Live scrolling transcript
│   │   │   │   ├── VoiceControls.tsx
│   │   │   │   ├── LeadScoreGauge.tsx
│   │   │   │   └── HandoffExport.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSocket.ts      # WebSocket connection
│   │   │   │   ├── useVoice.ts       # Agora / WebRTC interface
│   │   │   │   └── useSession.ts     # Call session state
│   │   │   ├── store/
│   │   │   │   └── sessionStore.ts   # Zustand or Context state
│   │   │   └── lib/
│   │   │       └── api.ts            # REST client
│   │   └── package.json
│
│   └── api/                          # Backend service
│       ├── src/
│       │   ├── routes/
│       │   │   ├── leads.ts          # CRUD for leads
│       │   │   ├── sessions.ts       # Call session management
│       │   │   └── handoff.ts        # Handoff generation endpoints
│       │   ├── services/
│       │   │   ├── VoicePipeline.ts  # STT + TTS orchestration
│       │   │   ├── AIAgent.ts        # LLM prompt routing + response
│       │   │   ├── RAGService.ts     # Knowledge base retrieval
│       │   │   ├── FieldExtractor.ts # Structured field parsing from transcript
│       │   │   ├── LeadScorer.ts     # Qualification scoring logic
│       │   │   └── HandoffGenerator.ts # Summary + JSON + email builder
│       │   ├── ws/
│       │   │   └── SocketServer.ts   # WebSocket event hub
│       │   ├── db/
│       │   │   ├── schema.ts         # DB schema definitions
│       │   │   ├── migrations/
│       │   │   └── seedData.ts       # 3 fake demo leads
│       │   ├── knowledge/
│       │   │   ├── products.json     # Product catalog
│       │   │   ├── objections.json   # Objection → rebuttal map
│       │   │   └── discovery.json    # Discovery question templates
│       │   └── index.ts              # Server entry point
│       └── package.json
│
├── packages/
│   └── shared/                       # Shared TypeScript types
│       ├── types/
│       │   ├── Lead.ts
│       │   ├── Session.ts
│       │   ├── Handoff.ts
│       │   └── SocketEvents.ts
│       └── package.json
│
├── .env.example
├── docker-compose.yml                # Optional: local Postgres + Chroma
├── README.md
└── package.json                      # Monorepo root (pnpm workspaces)
```

---

## Data Models

### Lead

```typescript
interface Lead {
  id: string;                  // UUID
  contactName: string;
  company: string;
  industry: string;
  initialUseCase: string;      // Pre-call hypothesis
  status: LeadStatus;          // 'new' | 'in_call' | 'sql' | 'disqualified'
  createdAt: string;           // ISO timestamp
  lastCallSessionId?: string;
}

type LeadStatus = 'new' | 'in_call' | 'sql' | 'disqualified';
```

### CallSession

```typescript
interface CallSession {
  id: string;
  leadId: string;
  startedAt: string;
  endedAt?: string;
  transcript: TranscriptLine[];
  extractedFields: ExtractedSalesFields;
  leadScore?: number;          // 0–100
  status: 'active' | 'ended';
}

interface TranscriptLine {
  speaker: 'AI' | 'PROSPECT' | 'REP';
  text: string;
  timestamp: string;
}
```

### ExtractedSalesFields

```typescript
interface ExtractedSalesFields {
  industry?: string;
  useCase?: string;
  painPoints: string[];
  budgetSignal?: 'Low' | 'Medium' | 'High' | 'Unknown';
  urgency?: 'Low' | 'Medium' | 'High' | 'Unknown';
  technicalFit?: 'Weak' | 'Moderate' | 'Strong' | 'Unknown';
  objections: string[];
  recommendedPackage?: string;
  nextStep?: string;
  unansweredQuestions: string[];
}
```

### Handoff

```typescript
interface Handoff {
  sessionId: string;
  leadId: string;
  generatedAt: string;
  summary: string;
  qualification: {
    score: number;             // 0–100
    dealStage: DealStage;
    productFit: string;
    urgency: string;
    budgetSignal: string;
    recommendedNextStep: string;
  };
  crmJson: CRMPayload;
  followUpEmailDraft: string;
  flaggedQuestions: string[];
}

type DealStage =
  | 'Marketing Qualified Lead'
  | 'Sales Qualified Lead'
  | 'Opportunity'
  | 'Needs Review';

interface CRMPayload {
  company: string;
  contact: string;
  industry: string;
  useCase: string;
  painPoints: string[];
  recommendedSolution: string;
  qualificationScore: number;
  dealStage: DealStage;
  urgency: string;
  budgetSignal: string;
  objections: string[];
  nextStep: string;
  handoffSummary: string;
}
```

---

## API Contracts

### REST Endpoints

```
GET    /api/leads                    → Lead[]
POST   /api/leads                    → Lead
GET    /api/leads/:id                → Lead
PATCH  /api/leads/:id/status         → Lead

POST   /api/sessions/start           body: { leadId } → CallSession
PATCH  /api/sessions/:id/end         → CallSession
GET    /api/sessions/:id             → CallSession

POST   /api/handoff/generate         body: { sessionId } → Handoff
GET    /api/handoff/:sessionId        → Handoff
```

### WebSocket Events (Socket.io)

```typescript
// Client → Server
'session:join'         payload: { sessionId: string }
'voice:transcript'     payload: { text: string, speaker: 'PROSPECT' | 'REP' }
'agent:mute'           payload: { sessionId: string }
'agent:unmute'         payload: { sessionId: string }
'rep:field:override'   payload: { sessionId: string, field: string, value: string }

// Server → Client
'transcript:update'    payload: TranscriptLine
'fields:update'        payload: Partial<ExtractedSalesFields>
'score:update'         payload: { score: number }
'agent:response'       payload: { text: string, audioUrl?: string }
'session:ended'        payload: { sessionId: string }
```

---

## AI Agent Design

### Prompt Architecture

The AI agent uses a **layered prompt system** — not a single monolithic prompt.

```
┌─────────────────────────────────────────┐
│            SYSTEM PROMPT                │
│  Role, constraints, golden rules,       │
│  persona, escalation triggers           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         CONTEXT INJECTION               │
│  Lead info, extracted fields so far,    │
│  current discovery stage, call state    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         RAG RETRIEVAL CONTEXT           │
│  Top-k relevant knowledge base chunks   │
│  retrieved by semantic similarity       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         CONVERSATION HISTORY            │
│  Last N transcript turns (windowed)     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         CURRENT PROSPECT INPUT          │
│  Latest STT-transcribed utterance       │
└─────────────────────────────────────────┘
```

### Agent State Machine

```
IDLE
  │
  ▼
INTRO          → Introduce AI, open discovery
  │
  ▼
DISCOVERY      → Ask structured qualifying questions
  │              (loop until sufficient signal captured)
  ▼
QA_HANDLING    → Triggered by product/technical question
  │              → RAG retrieval → grounded answer
  │              → OR escalation if out-of-scope
  ▼
OBJECTION      → Triggered by objection signal in transcript
  │              → Lookup rebuttal → respond calmly
  ▼
RECOMMEND      → Triggered when enough signals captured
  │              → Select package → state recommendation
  ▼
CLOSE          → Ask for next step commitment
  │
  ▼
ENDED          → Session ends → trigger handoff generation
```

### Field Extraction

Field extraction runs **in parallel** with the conversation — it does not interrupt the AI's voice turn. After each exchange, the backend sends the latest transcript window to a separate **field extraction prompt** that returns a JSON patch of newly detected values.

```typescript
// Extraction prompt output format
{
  "delta": {
    "useCase": "Live tutoring voice rooms",
    "urgency": "High",
    "objections": ["Concerned about integration time"]
  }
}
```

This delta is merged into `ExtractedSalesFields` and broadcast via `fields:update` WebSocket event.

### Lead Scoring Logic

Score is computed as a weighted sum across signals:

| Signal | Weight |
|--------|--------|
| Use case clarity | 20 |
| Technical fit | 20 |
| Urgency | 20 |
| Budget signal | 15 |
| Decision-maker involvement | 15 |
| Objection severity (inverse) | 10 |

Score 0–100. Thresholds:

| Score | Stage |
|-------|-------|
| ≥ 80 | Sales Qualified Lead |
| 60–79 | Marketing Qualified Lead |
| 40–59 | Needs Review |
| < 40 | Unqualified (rep decision required) |

---

## Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| **Latency** | AI voice response must begin within 1.5s of prospect's utterance end |
| **Transcript accuracy** | STT must achieve > 90% word accuracy on clear audio |
| **Reliability** | Call session must survive a single WebSocket reconnect without data loss |
| **Data safety** | No prospect PII written to logs; session data isolated per sessionId |
| **Accessibility** | Rep UI must be keyboard-navigable; transcript must be screen-reader compatible |
| **Demo stability** | Seed data + scripted scenario must produce consistent, repeatable demo output |
| **Browser support** | Chrome (latest), Safari (latest) — no IE, no mobile-first requirement for MVP |

---

## Out of Scope (MVP)

The following are explicitly **not built** for this version:

- User authentication and multi-user accounts
- Real CRM integration (Salesforce, HubSpot, Pipedrive)
- Real calendar booking
- Payment processing or billing
- Analytics dashboard or historical reporting
- Multi-tenant or white-label support
- Mobile app
- Multi-language support
- AI model fine-tuning pipeline
- Admin UI for knowledge base management
- Email sending (only draft generation)

---

## Success Metrics

### Demo Success (Hackathon)

| Metric | Target |
|--------|--------|
| End-to-end call demo completes without error | 100% |
| Copilot panel fields populated during call | ≥ 6 fields |
| Post-call CRM CSV generated correctly | Valid CSV, all required fields |
| Follow-up email draft generated | Coherent, personalized to demo scenario |
| AI avoids hallucination during product Q&A | 0 fabricated facts |
| AI correctly escalates 1 out-of-scope question | Confirmed in demo script |

### Product Success (Post-Hackathon)

| Metric | Definition |
|--------|-----------|
| Discovery Call Completion Rate | % of AI-assisted calls that reach a recommendation stage |
| SQL Conversion Rate | % of AI-scored SQLs confirmed by human rep |
| Field Extraction Accuracy | % of extracted fields matching human-verified ground truth |
| Handoff Utility Score | Rep-rated usefulness of generated handoff (1–5) |
| Time-to-Handoff | Seconds from call end to handoff generation complete |

---

*DealPilot AI — PRD v1.0*
*Prepared for hackathon MVP build. All decisions optimized for demo completeness, judge clarity, and technical execution speed.*