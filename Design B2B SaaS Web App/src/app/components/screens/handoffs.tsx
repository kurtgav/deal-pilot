import { useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Mail,
  Eye,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

interface HandoffsProps {
  onNavigate: (screen: string, leadId?: string) => void;
}

type ApprovalStatus = "draft" | "needs_review" | "approved" | "exported" | "flagged";

interface Handoff {
  id: string;
  leadId: string;
  company: string;
  contact: string;
  generated: string;
  qualScore: number;
  dealStage: string;
  productFit: string;
  status: ApprovalStatus;
  flagged: number;
  summary: string;
  nextStep: string;
}

const handoffs: Handoff[] = [
  {
    id: "h1",
    leadId: "2",
    company: "CloudCart PH",
    contact: "Rafael Santos",
    generated: "2 min ago",
    qualScore: 82,
    dealStage: "Qualification",
    productFit: "Strong",
    status: "needs_review",
    flagged: 2,
    summary: "Multi-vendor marketplace looking to automate merchant onboarding from 3 weeks to days. Budget $5-10K/mo, Q2 2026 timeline.",
    nextStep: "Technical validation call with sales engineer",
  },
  {
    id: "h2",
    leadId: "1",
    company: "NovaStack Labs",
    contact: "Maya Chen",
    generated: "1 hr ago",
    qualScore: 78,
    dealStage: "Discovery",
    productFit: "Strong",
    status: "approved",
    flagged: 0,
    summary: "API-first dev tools startup. Sales engineering bandwidth constraints. Ready to evaluate Growth package.",
    nextStep: "Send Growth package proposal",
  },
  {
    id: "h3",
    leadId: "3",
    company: "FinOpsly",
    contact: "Anika Reyes",
    generated: "Yesterday",
    qualScore: 68,
    dealStage: "Qualification",
    productFit: "Medium",
    status: "flagged",
    flagged: 3,
    summary: "Fintech with complex compliance needs. SOC2 + PCI-DSS hard requirements unclear.",
    nextStep: "Compliance review with legal",
  },
  {
    id: "h4",
    leadId: "5",
    company: "HealthTrack Pro",
    contact: "Sarah Johnson",
    generated: "2 days ago",
    qualScore: 71,
    dealStage: "Discovery",
    productFit: "Medium",
    status: "exported",
    flagged: 0,
    summary: "Patient engagement platform. HIPAA required. Smaller deal size but ICP-fit.",
    nextStep: "Demo scheduled",
  },
];

const statusMap: Record<ApprovalStatus, { label: string; variant: "default" | "warning" | "success" | "secondary" | "destructive" }> = {
  draft: { label: "Draft", variant: "secondary" },
  needs_review: { label: "Needs Review", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  exported: { label: "Exported", variant: "default" },
  flagged: { label: "Flagged", variant: "destructive" },
};

export function Handoffs({ onNavigate }: HandoffsProps) {
  const [tab, setTab] = useState<"all" | ApprovalStatus>("all");
  const [previewId, setPreviewId] = useState<string | null>(handoffs[0].id);

  const filtered = tab === "all" ? handoffs : handoffs.filter((h) => h.status === tab);
  const preview = handoffs.find((h) => h.id === previewId);

  const metrics = [
    { label: "Generated Today", value: "4", icon: FileText, color: "text-primary" },
    { label: "Awaiting Approval", value: "1", icon: Clock, color: "text-warning" },
    { label: "Approved", value: "1", icon: CheckCircle2, color: "text-success" },
    { label: "Flagged Questions", value: "5", icon: AlertTriangle, color: "text-danger" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Handoffs</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review CRM-ready summaries, transcripts, flagged questions, and follow-up drafts.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{m.label}</p>
                    <h3 className="text-3xl font-semibold mt-2">{m.value}</h3>
                  </div>
                  <Icon className={`w-5 h-5 ${m.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-accent/5 border-accent/20">
        <CardContent className="p-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
          <p className="text-xs text-foreground">
            DealPilot AI never exports CRM data or sends emails without rep approval.
          </p>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="needs_review">Needs Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="exported">Exported</TabsTrigger>
          <TabsTrigger value="flagged">Flagged</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-3 pl-4 text-sm font-medium text-muted-foreground">Company / Contact</th>
                  <th className="py-3 text-sm font-medium text-muted-foreground">Generated</th>
                  <th className="py-3 text-sm font-medium text-muted-foreground">Score</th>
                  <th className="py-3 text-sm font-medium text-muted-foreground">Stage</th>
                  <th className="py-3 text-sm font-medium text-muted-foreground">Fit</th>
                  <th className="py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="py-3 text-sm font-medium text-muted-foreground">Flagged</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => {
                  const status = statusMap[h.status];
                  return (
                    <tr
                      key={h.id}
                      className={`border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 ${
                        previewId === h.id ? "bg-muted/50" : ""
                      }`}
                      onClick={() => setPreviewId(h.id)}
                    >
                      <td className="py-4 pl-4">
                        <p className="text-sm font-medium">{h.company}</p>
                        <p className="text-xs text-muted-foreground">{h.contact}</p>
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">{h.generated}</td>
                      <td className="py-4 text-sm font-semibold">{h.qualScore}</td>
                      <td className="py-4 text-sm text-muted-foreground">{h.dealStage}</td>
                      <td className="py-4 text-sm">{h.productFit}</td>
                      <td className="py-4"><Badge variant={status.variant}>{status.label}</Badge></td>
                      <td className="py-4">
                        {h.flagged > 0 ? (
                          <span className="inline-flex items-center gap-1 text-sm text-warning">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {h.flagged}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-4 pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Review"
                            onClick={() => onNavigate("post-call", h.leadId)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Copy JSON">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Email draft">
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {preview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Handoff Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold">{preview.company}</p>
                <p className="text-xs text-muted-foreground">{preview.contact} · {preview.generated}</p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <p className="text-xs font-medium text-accent">AI Summary</p>
                </div>
                <p className="text-sm text-foreground">{preview.summary}</p>
              </div>

              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground">Recommended next step</p>
                <p className="text-sm font-medium mt-0.5">{preview.nextStep}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">CRM JSON</span>
                  <Badge variant="secondary">Ready · Awaiting approval</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Email draft</span>
                  <Badge variant="secondary">Drafted · Not sent</Badge>
                </div>
              </div>

              <Button className="w-full" onClick={() => onNavigate("post-call", preview.leadId)}>
                Review Handoff
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
