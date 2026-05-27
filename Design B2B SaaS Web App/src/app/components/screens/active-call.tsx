import { useState } from "react";
import { Phone, Mic, MicOff, Circle, TrendingUp, AlertTriangle, Package, ArrowRight, Pause, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { demoLeads, activeCallTranscript, extractedSignals } from "../../data/demo-data";

interface ActiveCallProps {
  leadId: string;
  onNavigate: (screen: string, leadId?: string) => void;
}

export function ActiveCall({ leadId, onNavigate }: ActiveCallProps) {
  const lead = demoLeads.find((l) => l.id === leadId);
  const [aiStatus, setAiStatus] = useState<"listening" | "thinking" | "speaking" | "muted">("listening");
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [callDuration, setCallDuration] = useState("12:47");

  if (!lead) {
    return <div className="p-6">Lead not found</div>;
  }

  const getStatusColor = (status: typeof aiStatus) => {
    switch (status) {
      case "listening":
        return "text-accent";
      case "thinking":
        return "text-warning";
      case "speaking":
        return "text-success";
      case "muted":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusBg = (status: typeof aiStatus) => {
    switch (status) {
      case "listening":
        return "bg-accent/10 border-accent/20";
      case "thinking":
        return "bg-warning/10 border-warning/20";
      case "speaking":
        return "bg-success/10 border-success/20";
      case "muted":
        return "bg-muted border-border";
      default:
        return "bg-muted border-border";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">{lead.contact.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{lead.company}</h2>
              <p className="text-sm text-muted-foreground">{lead.contact} • {lead.title}</p>
            </div>
            <Badge variant="live" className="ml-2">
              <Circle className="w-2 h-2 mr-1 fill-current" />
              Live Call
            </Badge>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-semibold tabular-nums">{callDuration}</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>

            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusBg(aiStatus)}`}>
              <Circle className={`w-2 h-2 ${getStatusColor(aiStatus)}`} />
              <span className={`text-sm font-medium ${getStatusColor(aiStatus)}`}>
                AI {aiStatus.charAt(0).toUpperCase() + aiStatus.slice(1)}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20">
              <Circle className="w-2 h-2 fill-success text-success" />
              <span className="text-sm font-medium text-success">Connected</span>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => onNavigate("post-call", leadId)}
            >
              <Phone className="w-4 h-4" />
              End Call
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
            <div className="max-w-4xl mx-auto space-y-4">
              {activeCallTranscript.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.speaker === "Rep" ? "flex-row-reverse" : ""
                  }`}
                >
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
                  <div className={`flex-1 ${message.speaker === "Rep" ? "flex flex-col items-end" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-foreground">{message.speaker}</span>
                      <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                    </div>
                    <div
                      className={`p-3 rounded-lg max-w-2xl ${
                        message.speaker === "AI"
                          ? "bg-accent/10 border border-accent/20"
                          : message.speaker === "Prospect"
                          ? "bg-card border border-border"
                          : "bg-secondary/10 border border-secondary/20"
                      }`}
                    >
                      <p className="text-sm text-foreground leading-relaxed">{message.message}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex gap-3 items-start p-4 rounded-lg bg-warning/10 border border-warning/20">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">AI Escalation</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    "That's a great technical question — I'll flag this for our human sales engineer in the follow-up."
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border bg-card p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4">
                <Button
                  variant={isMuted ? "destructive" : "outline"}
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                <Button
                  variant={isPaused ? "secondary" : "outline"}
                  size="icon"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                </Button>

                <div className="flex-1 flex items-center gap-3 px-4 py-2 rounded-lg bg-muted">
                  <div className="flex gap-1">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-accent rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 20 + 10}px`,
                          animationDelay: `${i * 0.05}s`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">AI is listening...</span>
                </div>

                <Button variant="outline">Rep Override</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-96 border-l border-border bg-card overflow-y-auto">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Sales Copilot</h3>

              <Card className="border-2 border-success/20">
                <CardContent className="p-6 text-center">
                  <div className="relative inline-flex">
                    <svg className="w-32 h-32 -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        className="stroke-muted"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        className="stroke-success"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(82 / 100) * 2 * Math.PI * 56} ${2 * Math.PI * 56}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div>
                        <p className="text-4xl font-bold text-success">82</p>
                        <p className="text-xs text-muted-foreground">/ 100</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-success mt-4">Sales Qualified Lead</p>
                  <p className="text-xs text-muted-foreground mt-1">Advisory only — rep decides</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Extracted Signals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Industry</p>
                  <p className="text-sm text-foreground mt-0.5">{extractedSignals.industry}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Use Case</p>
                  <p className="text-sm text-foreground mt-0.5">{extractedSignals.useCase}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Pain Points</p>
                  <ul className="space-y-1 mt-1">
                    {extractedSignals.painPoints.slice(0, 2).map((point, idx) => (
                      <li key={idx} className="text-xs text-foreground flex items-start gap-1">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

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

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Technical Fit</p>
                  <Badge variant="success" className="mt-1">
                    {extractedSignals.technicalFit}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-warning/20 bg-warning/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <CardTitle className="text-sm">Objection Detected</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-foreground">{extractedSignals.objections[0]}</p>
                <div className="p-2 rounded bg-card border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Suggested Rebuttal:</p>
                  <p className="text-xs text-foreground">
                    "We have case studies showing 60% reduction in integration time with similar complex APIs."
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm">Recommended Package</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  {extractedSignals.recommendedPackage}
                </p>
                <p className="text-xs text-muted-foreground">
                  Based on budget signal, technical requirements, and scaling needs
                </p>
                <Badge variant="accent" className="text-xs">
                  85% Confidence
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Needs human confirmation
                </p>
              </CardContent>
            </Card>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Rep Override</label>
              <input
                type="text"
                placeholder="Manual note or signal adjustment..."
                className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button size="sm" className="w-full mt-2">
                Apply Override
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
