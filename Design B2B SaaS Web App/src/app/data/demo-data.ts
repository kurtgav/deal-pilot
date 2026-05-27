export type LeadStatus = "new" | "contacted" | "in_call" | "sql" | "needs_review" | "qualified" | "unqualified";
export type DealStage = "discovery" | "qualification" | "technical_validation" | "proposal" | "negotiation" | "closed_won" | "closed_lost";

export interface Lead {
  id: string;
  contact: string;
  company: string;
  industry: string;
  useCase: string;
  status: LeadStatus;
  score: number;
  lastCall?: string;
  email: string;
  title: string;
  phone: string;
  hypothesis?: string;
  callObjective?: string;
}

export interface CallTranscriptMessage {
  id: string;
  speaker: "AI" | "Prospect" | "Rep";
  message: string;
  timestamp: string;
}

export interface ExtractedSalesSignals {
  industry: string;
  useCase: string;
  painPoints: string[];
  budgetSignal: string;
  urgency: string;
  technicalFit: string;
  objections: string[];
  recommendedPackage: string;
  nextStep: string;
  unansweredQuestions: string[];
}

export interface FlaggedQuestion {
  id: string;
  question: string;
  reason: string;
  owner: string;
  status: "needs_followup" | "answered";
}

export const demoLeads: Lead[] = [
  {
    id: "1",
    contact: "Maya Chen",
    company: "NovaStack Labs",
    industry: "Developer Tools",
    useCase: "API Development Platform",
    status: "sql",
    score: 82,
    lastCall: "2026-05-26 14:30",
    email: "maya.chen@novastack.io",
    title: "VP of Engineering",
    phone: "+1 (555) 123-4567",
    hypothesis: "Growing API-first startup with limited sales engineering resources",
    callObjective: "Qualify technical needs and package fit",
  },
  {
    id: "2",
    contact: "Rafael Santos",
    company: "CloudCart PH",
    industry: "E-commerce SaaS",
    useCase: "Multi-vendor Marketplace",
    status: "in_call",
    score: 76,
    lastCall: "Live now",
    email: "rafael@cloudcart.ph",
    title: "CTO",
    phone: "+63 912 345 6789",
    hypothesis: "Scaling e-commerce platform, pain in onboarding merchant integrations",
    callObjective: "Understand integration requirements and timeline urgency",
  },
  {
    id: "3",
    contact: "Anika Reyes",
    company: "FinOpsly",
    industry: "Fintech",
    useCase: "Cloud Cost Optimization",
    status: "needs_review",
    score: 68,
    lastCall: "2026-05-25 10:15",
    email: "anika@finopsly.com",
    title: "Head of Product",
    phone: "+1 (555) 987-6543",
    hypothesis: "Mid-market fintech with complex compliance requirements",
    callObjective: "Assess compliance fit and budget alignment",
  },
  {
    id: "4",
    contact: "James Liu",
    company: "DataStream AI",
    industry: "Data Analytics",
    useCase: "Real-time Data Pipeline",
    status: "new",
    score: 0,
    email: "james@datastream.ai",
    title: "Director of Engineering",
    phone: "+1 (555) 234-5678",
  },
  {
    id: "5",
    contact: "Sarah Johnson",
    company: "HealthTrack Pro",
    industry: "Healthcare SaaS",
    useCase: "Patient Engagement Platform",
    status: "contacted",
    score: 45,
    lastCall: "2026-05-24 16:00",
    email: "sarah@healthtrack.pro",
    title: "CEO",
    phone: "+1 (555) 345-6789",
  },
];

export const activeCallTranscript: CallTranscriptMessage[] = [
  {
    id: "1",
    speaker: "AI",
    message: "Hi Rafael! I'm DealPilot AI, joining this call to help with technical discovery. I'll be taking notes and can answer questions from our knowledge base. Your sales rep is fully in control. Sound good?",
    timestamp: "14:32:15",
  },
  {
    id: "2",
    speaker: "Prospect",
    message: "Sure, that works. So we're looking at your API integration platform for our marketplace. Right now, onboarding new merchants takes our team about 3 weeks per integration.",
    timestamp: "14:32:42",
  },
  {
    id: "3",
    speaker: "AI",
    message: "Thanks for sharing that, Rafael. A 3-week integration timeline definitely sounds like a pain point. Can you tell me more about what's causing that delay? Is it primarily on the technical implementation side, or are there business process steps involved?",
    timestamp: "14:33:05",
  },
  {
    id: "4",
    speaker: "Prospect",
    message: "Mostly technical. Every merchant has a different API structure, so we're essentially building custom connectors each time. We have about 15 merchants now, but we're trying to scale to 100+ this year.",
    timestamp: "14:33:28",
  },
  {
    id: "5",
    speaker: "AI",
    message: "Got it. Scaling from 15 to 100+ merchants with custom integrations would be challenging. Have you evaluated any integration platforms before, or is this your first look at automation for this process?",
    timestamp: "14:33:52",
  },
  {
    id: "6",
    speaker: "Prospect",
    message: "We looked at Zapier and Make, but they're too consumer-focused. We need something that handles complex B2B API patterns, rate limiting, webhook management. Budget-wise, we're probably looking at $5-10K per month.",
    timestamp: "14:34:15",
  },
  {
    id: "7",
    speaker: "AI",
    message: "That makes sense. The $5-10K range aligns well with our Growth API Package. One technical question: how important is real-time sync versus batch processing for your merchant integrations? And do you have any specific compliance requirements around data handling?",
    timestamp: "14:34:42",
  },
  {
    id: "8",
    speaker: "Prospect",
    message: "Real-time is critical for inventory and order updates. For compliance, we're PCI-DSS compliant, so the platform needs to support that. How long does implementation usually take?",
    timestamp: "14:35:08",
  },
  {
    id: "9",
    speaker: "AI",
    message: "That's a great technical question — I'll flag this for our human sales engineer to provide detailed implementation timelines in the follow-up. From our knowledge base, I can confirm we support PCI-DSS compliance and real-time webhooks. What's your target timeline for getting this live?",
    timestamp: "14:35:35",
  },
  {
    id: "10",
    speaker: "Prospect",
    message: "We'd like to have this running in the next quarter. Honestly, my main concern is whether it can actually handle the complexity of our merchant APIs. Some of them are pretty gnarly.",
    timestamp: "14:36:02",
  },
];

export const extractedSignals: ExtractedSalesSignals = {
  industry: "E-commerce SaaS",
  useCase: "Multi-vendor marketplace integration automation",
  painPoints: [
    "3-week integration timeline per merchant",
    "Custom connector development for each integration",
    "Scaling challenge: 15 to 100+ merchants",
    "Generic tools (Zapier/Make) insufficient for B2B complexity",
  ],
  budgetSignal: "Medium ($5-10K/month)",
  urgency: "High (Q2 2026 target)",
  technicalFit: "Strong (real-time sync, PCI-DSS, webhook management)",
  objections: ["Concerned about API complexity handling", "Implementation timeline unclear"],
  recommendedPackage: "Growth API Package",
  nextStep: "Technical validation call with sales engineer",
  unansweredQuestions: ["Detailed implementation timeline", "Custom API complexity examples"],
};

export const flaggedQuestions: FlaggedQuestion[] = [
  {
    id: "1",
    question: "How long does implementation usually take?",
    reason: "Requires customer-specific scoping from human sales engineer",
    owner: "Human Sales Engineer",
    status: "needs_followup",
  },
  {
    id: "2",
    question: "Can it handle complex, non-standard merchant APIs?",
    reason: "Needs technical validation with specific examples",
    owner: "Human Sales Engineer",
    status: "needs_followup",
  },
];

export const postCallSummary = {
  callDuration: "12m 47s",
  qualificationScore: 82,
  dealStage: "qualification" as DealStage,
  productFit: "Strong",
  recommendedNextStep: "Schedule technical validation call with sales engineer",
};

export const crmJsonData = {
  lead_id: "cloudcart_ph_rafael_santos",
  timestamp: "2026-05-26T14:45:00Z",
  contact: {
    name: "Rafael Santos",
    title: "CTO",
    email: "rafael@cloudcart.ph",
    phone: "+63 912 345 6789",
  },
  company: {
    name: "CloudCart PH",
    industry: "E-commerce SaaS",
    employee_count: "estimated_50_100",
  },
  qualification: {
    score: 82,
    stage: "qualification",
    use_case: "Multi-vendor marketplace integration automation",
    pain_points: [
      "3-week integration timeline per merchant",
      "Custom connector development",
      "Scaling to 100+ merchants",
    ],
    budget: {
      range: "$5-10K/month",
      signal: "medium",
    },
    urgency: {
      level: "high",
      timeline: "Q2 2026",
    },
    technical_fit: "strong",
    requirements: ["Real-time sync", "PCI-DSS compliance", "Webhook management"],
  },
  recommended_action: {
    next_step: "Technical validation call",
    package: "Growth API Package",
    owner: "Human Sales Engineer",
  },
  objections: [
    {
      concern: "API complexity handling",
      severity: "medium",
    },
    {
      concern: "Implementation timeline",
      severity: "low",
    },
  ],
  flagged_questions: [
    "Implementation timeline scoping",
    "Custom API complexity validation",
  ],
};

export const followUpEmail = {
  subject: "CloudCart PH + DealPilot AI: Next Steps & Technical Validation",
  body: `Hi Rafael,

Thank you for the great conversation today! I'm excited about the potential fit between CloudCart PH and our Growth API Package.

**What We Learned:**
• Your current 3-week integration timeline is a significant bottleneck
• Scaling from 15 to 100+ merchants requires automation
• Real-time sync and PCI-DSS compliance are critical requirements
• Budget alignment at $5-10K/month

**Recommended Next Step:**
I'd like to connect you with our Senior Sales Engineer for a technical validation call. They can:
1. Review specific examples of your complex merchant APIs
2. Provide a detailed implementation timeline
3. Demo our webhook management and real-time sync capabilities

**Questions to Address:**
• Detailed implementation timeline with your specific use case
• How we handle non-standard API patterns (we'd love to see examples)

Are you available for a 45-minute technical call this Thursday or Friday?

Best regards,
[Your Sales Rep Name]

P.S. DealPilot AI flagged a few technical questions for our engineering team — they'll be ready to dive deep on the call.`,
};
