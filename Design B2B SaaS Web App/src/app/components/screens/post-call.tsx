import { useState } from "react";
import { Clock, TrendingUp, Package, ArrowRight, AlertCircle, Copy, Download, Mail, CheckCircle2, FileJson } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import * as Tabs from "@radix-ui/react-tabs";
import {
  demoLeads,
  activeCallTranscript,
  extractedSignals,
  flaggedQuestions,
  postCallSummary,
  crmJsonData,
  followUpEmail,
} from "../../data/demo-data";

interface PostCallProps {
  leadId: string;
  onNavigate: (screen: string) => void;
}

export function PostCall({ leadId, onNavigate }: PostCallProps) {
  const lead = demoLeads.find((l) => l.id === leadId);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");

  if (!lead) {
    return <div className="p-6">Lead not found</div>;
  }

  const ApprovalModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Approve Handoff Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            AI will not create CRM entries or send emails without rep approval. Please review the handoff data before proceeding.
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm">Summary reviewed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm">CRM JSON reviewed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm">Email draft reviewed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm">Flagged questions acknowledged</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowApprovalModal(false)}>
              Cancel
            </Button>
            <Button variant="outline" className="flex-1">
              <Copy className="w-4 h-4" />
              Copy JSON
            </Button>
            <Button className="flex-1" onClick={() => {
              setShowApprovalModal(false);
              onNavigate("dashboard");
            }}>
              Approve Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Post-Call Handoff</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {lead.company} • {lead.contact} • {new Date().toLocaleString()}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onNavigate("dashboard")}>
            Back to Dashboard
          </Button>
          <Button onClick={() => setShowApprovalModal(true)}>
            <Download className="w-4 h-4" />
            Export to CRM
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Qualification Score</p>
                <p className="text-2xl font-semibold mt-1 text-success">{postCallSummary.qualificationScore}</p>
              </div>
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Deal Stage</p>
                <p className="text-sm font-semibold mt-1 capitalize">
                  {postCallSummary.dealStage.replace(/_/g, " ")}
                </p>
              </div>
              <Clock className="w-4 h-4 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Product Fit</p>
                <Badge variant="success" className="mt-1">
                  {postCallSummary.productFit}
                </Badge>
              </div>
              <Package className="w-4 h-4 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Call Duration</p>
                <p className="text-sm font-semibold mt-1">{postCallSummary.callDuration}</p>
              </div>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex gap-1 border-b border-border">
          {["summary", "transcript", "crm-json", "email", "questions"].map((tab) => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {tab === "crm-json" ? "CRM JSON" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="summary" className="pt-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pain Points</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {extractedSignals.painPoints.map((point, idx) => (
                    <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Use Case</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">{extractedSignals.useCase}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Budget & Urgency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Budget Signal</p>
                  <Badge variant="secondary" className="mt-1">
                    {extractedSignals.budgetSignal}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Urgency</p>
                  <Badge variant="warning" className="mt-1">
                    {extractedSignals.urgency}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Technical Fit</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="success" className="mb-3">
                  {extractedSignals.technicalFit}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Real-time sync, PCI-DSS compliance, webhook management
                </p>
              </CardContent>
            </Card>

            <Card className="col-span-2 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Recommended Package</p>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {extractedSignals.recommendedPackage}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Next Step</p>
                  <p className="text-sm text-foreground mt-1">{extractedSignals.nextStep}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Tabs.Content>

        <Tabs.Content value="transcript" className="pt-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {activeCallTranscript.map((message) => (
                  <div key={message.id} className="flex gap-3 items-start">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                        message.speaker === "AI"
                          ? "bg-accent text-accent-foreground"
                          : message.speaker === "Prospect"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {message.speaker === "AI" ? "AI" : message.speaker.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-foreground">{message.speaker}</span>
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{message.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="crm-json" className="pt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">CRM Export JSON</CardTitle>
                <Button size="sm" variant="outline">
                  <Copy className="w-4 h-4" />
                  Copy JSON
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-green-400 font-mono">
                  {JSON.stringify(crmJsonData, null, 2)}
                </pre>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-foreground">
                  Requires rep approval before export. AI will not automatically create CRM entries.
                </p>
              </div>
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="email" className="pt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Follow-Up Email Draft</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Copy className="w-4 h-4" />
                    Copy Email
                  </Button>
                  <Button size="sm" variant="outline">
                    Regenerate Draft
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Subject</label>
                <input
                  type="text"
                  value={followUpEmail.subject}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  readOnly
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Body</label>
                <textarea
                  value={followUpEmail.body}
                  rows={16}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                  readOnly
                />
              </div>
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-foreground">
                  Email sending requires manual review. AI will not send emails automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="questions" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                Flagged Questions (Needs Follow-Up)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flaggedQuestions.map((question) => (
                  <div key={question.id} className="p-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <p className="text-sm font-medium text-foreground">{question.question}</p>
                      <Badge variant="warning" className="shrink-0">
                        {question.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      <strong>Reason:</strong> {question.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Owner:</strong> {question.owner}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>

      {showApprovalModal && <ApprovalModal />}
    </div>
  );
}
