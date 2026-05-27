import {
  Phone,
  MicOff,
  Clock,
  AlertTriangle,
  Circle,
  Radio,
  Brain,
  Volume2,
  Wifi,
  Database,
  ShieldCheck,
  Activity,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface ActiveCallsProps {
  onNavigate: (screen: string, leadId?: string) => void;
}

type CallStatus = "live" | "ai_muted" | "paused" | "ending" | "reconnecting";
type AIState = "listening" | "thinking" | "speaking" | "muted";

interface ActiveCall {
  id: string;
  leadId: string;
  contact: string;
  company: string;
  industry: string;
  status: CallStatus;
  aiState: AIState;
  duration: string;
  score: number;
  objections: number;
  topObjection?: string;
  featured?: boolean;
}

const activeCalls: ActiveCall[] = [
  {
    id: "c1",
    leadId: "2",
    contact: "Rafael Santos",
    company: "CloudCart PH",
    industry: "E-commerce SaaS",
    status: "live",
    aiState: "listening",
    duration: "12:47",
    score: 82,
    objections: 1,
    topObjection: "Integration time concern",
    featured: true,
  },
  {
    id: "c2",
    leadId: "5",
    contact: "Sarah Johnson",
    company: "HealthTrack Pro",
    industry: "Healthcare SaaS",
    status: "ai_muted",
    aiState: "muted",
    duration: "04:12",
    score: 58,
    objections: 0,
  },
  {
    id: "c3",
    leadId: "4",
    contact: "James Liu",
    company: "DataStream AI",
    industry: "Data Analytics",
    status: "reconnecting",
    aiState: "thinking",
    duration: "08:33",
    score: 64,
    objections: 2,
  },
];

const statusMap: Record<CallStatus, { label: string; variant: "live" | "warning" | "secondary" | "default" | "accent" }> = {
  live: { label: "Live", variant: "live" },
  ai_muted: { label: "AI Muted", variant: "secondary" },
  paused: { label: "Paused", variant: "warning" },
  ending: { label: "Ending", variant: "default" },
  reconnecting: { label: "Reconnecting", variant: "warning" },
};

const aiStateMap: Record<AIState, { label: string; icon: typeof Radio; color: string }> = {
  listening: { label: "Listening", icon: Radio, color: "text-accent" },
  thinking: { label: "Thinking", icon: Brain, color: "text-primary" },
  speaking: { label: "Speaking", icon: Volume2, color: "text-accent" },
  muted: { label: "Muted", icon: MicOff, color: "text-muted-foreground" },
};

export function ActiveCalls({ onNavigate }: ActiveCallsProps) {
  const metrics = [
    { label: "Live Calls", value: "1", icon: Phone, color: "text-accent" },
    { label: "AI Muted", value: "1", icon: MicOff, color: "text-muted-foreground" },
    { label: "Avg Call Duration", value: "08:31", icon: Clock, color: "text-primary" },
    { label: "Needs Attention", value: "2", icon: AlertTriangle, color: "text-warning" },
  ];

  const health = [
    { label: "Voice connection", value: "Stable", icon: Wifi, ok: true },
    { label: "WebSocket", value: "Connected", icon: Activity, ok: true },
    { label: "Knowledge base", value: "Loaded", icon: Database, ok: true },
    { label: "Transcript streaming", value: "Active", icon: Radio, ok: true },
    { label: "Safety guardrail", value: "Enabled", icon: ShieldCheck, ok: true },
  ];

  const featured = activeCalls.find((c) => c.featured);
  const others = activeCalls.filter((c) => !c.featured);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Active Calls</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor live AI-assisted discovery sessions and call readiness.
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

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {activeCalls.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Phone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-base font-semibold">No active calls right now</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Start a discovery session from your lead workspace.
                </p>
                <Button className="mt-4" onClick={() => onNavigate("leads")}>
                  Start from Leads
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {featured && (
                <Card className="border-accent/40 ring-1 ring-accent/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-sm font-semibold text-accent">
                          {featured.contact.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{featured.contact}</p>
                            <Badge variant="live">
                              <Circle className="w-2 h-2 mr-1 fill-current" />
                              Live
                            </Badge>
                            <Badge variant="accent">
                              <Sparkles className="w-3 h-3" />
                              AI Listening
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {featured.company} · {featured.industry}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-lg font-semibold tabular-nums">{featured.duration}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Lead score</p>
                        <p className="text-xl font-semibold text-success mt-1">{featured.score}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Objections</p>
                        <p className="text-xl font-semibold text-warning mt-1">{featured.objections}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">AI state</p>
                        <p className="text-sm font-medium text-accent mt-1">Listening</p>
                      </div>
                    </div>

                    {featured.topObjection && (
                      <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                        <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-foreground">Open objection</p>
                          <p className="text-sm text-muted-foreground">{featured.topObjection}</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <Button onClick={() => onNavigate("active-call", featured.leadId)}>
                        Open Call Room
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>All active sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Company</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Contact</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">AI</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Duration</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Score</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Obj.</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {others.map((c) => {
                        const ai = aiStateMap[c.aiState];
                        const AiIcon = ai.icon;
                        const status = statusMap[c.status];
                        return (
                          <tr key={c.id} className="border-b border-border last:border-0">
                            <td className="py-4 text-sm font-medium">{c.company}</td>
                            <td className="py-4 text-sm text-muted-foreground">
                              {c.contact}
                              <div className="text-xs">{c.industry}</div>
                            </td>
                            <td className="py-4">
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </td>
                            <td className="py-4">
                              <span className={`inline-flex items-center gap-1.5 text-sm ${ai.color}`}>
                                <AiIcon className="w-3.5 h-3.5" />
                                {ai.label}
                              </span>
                            </td>
                            <td className="py-4 text-sm tabular-nums">{c.duration}</td>
                            <td className="py-4 text-sm font-semibold">{c.score}</td>
                            <td className="py-4 text-sm">{c.objections}</td>
                            <td className="py-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onNavigate("active-call", c.leadId)}
                              >
                                Open
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="w-4 h-4 text-accent" />
                Call Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {health.map((h) => {
                const Icon = h.icon;
                return (
                  <div key={h.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{h.label}</span>
                    </div>
                    <Badge variant={h.ok ? "success" : "warning"}>{h.value}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  AI is advisory only. Reps stay in control of every call and can mute, pause, or end the AI at any time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
