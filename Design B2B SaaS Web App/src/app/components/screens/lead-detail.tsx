import { Phone, Mail, Building2, Briefcase, CheckCircle2, Shield, Database, Mic } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { demoLeads } from "../../data/demo-data";

interface LeadDetailProps {
  leadId: string;
  onNavigate: (screen: string, leadId?: string) => void;
}

export function LeadDetail({ leadId, onNavigate }: LeadDetailProps) {
  const lead = demoLeads.find((l) => l.id === leadId);

  if (!lead) {
    return <div className="p-6">Lead not found</div>;
  }

  const readinessChecklist = [
    { label: "Lead profile complete", checked: true },
    { label: "Pre-call hypothesis documented", checked: true },
    { label: "Knowledge base synced", checked: true },
    { label: "Voice engine ready", checked: true },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{lead.company}</h2>
          <p className="text-sm text-muted-foreground mt-1">Pre-Call Setup</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => onNavigate("dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="text-sm font-semibold text-primary">
                      {lead.contact.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{lead.contact}</p>
                    <p className="text-xs text-muted-foreground">{lead.title}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{lead.company}</p>
                    <p className="text-xs text-muted-foreground">{lead.industry}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-xs text-muted-foreground">{lead.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Use Case</p>
                    <p className="text-sm text-muted-foreground mt-1">{lead.useCase}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pre-Call Hypothesis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">
                {lead.hypothesis || "No hypothesis documented yet."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Call Objective</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">
                {lead.callObjective || "Define your objectives for this call."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Readiness Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {readinessChecklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2
                      className={`w-5 h-5 ${
                        item.checked ? "text-success" : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                AI Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">AI Persona</p>
                <p className="text-xs text-muted-foreground mt-1">DealPilot AI</p>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">Voice Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <p className="text-xs text-success">Ready</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">Knowledge Base</p>
                <div className="flex items-center gap-2 mt-1">
                  <Database className="w-4 h-4 text-success" />
                  <p className="text-xs text-success">Grounded knowledge base loaded</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-3">
                  <Shield className="w-3 h-3 inline mr-1" />
                  AI will only answer from curated knowledge base
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => onNavigate("active-call", leadId)}
                >
                  Start Voice Sales Call
                </Button>
                <Button variant="outline" className="w-full">
                  <Mic className="w-4 h-4" />
                  Test AI Voice
                </Button>
                <Button variant="ghost" className="w-full">
                  View Demo Scenario
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Guardrails</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                  <span>No fabrication — only knowledge base answers</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                  <span>Escalates unknown questions to human</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                  <span>No pricing or SLA commitments</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                  <span>Rep can mute, pause, or end anytime</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
