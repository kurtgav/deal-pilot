import { useState } from "react";
import {
  Search,
  Plus,
  Circle,
  ArrowRight,
  Phone,
  FileText,
  Eye,
  X,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { demoLeads, type Lead } from "../../data/demo-data";

interface LeadsProps {
  onNavigate: (screen: string, leadId?: string) => void;
}

const statusBadge = (status: Lead["status"]) => {
  switch (status) {
    case "new":
      return { variant: "default" as const, label: "New Lead" };
    case "contacted":
      return { variant: "secondary" as const, label: "Contacted" };
    case "in_call":
      return { variant: "live" as const, label: "In Call" };
    case "sql":
      return { variant: "success" as const, label: "SQL" };
    case "needs_review":
      return { variant: "warning" as const, label: "Needs Review" };
    case "qualified":
      return { variant: "success" as const, label: "Qualified" };
    case "unqualified":
      return { variant: "destructive" as const, label: "Disqualified" };
    default:
      return { variant: "default" as const, label: status };
  }
};

export function Leads({ onNavigate }: LeadsProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>("1");
  const [search, setSearch] = useState("");

  const filtered = demoLeads.filter(
    (l) =>
      l.contact.toLowerCase().includes(search.toLowerCase()) ||
      l.company.toLowerCase().includes(search.toLowerCase()),
  );
  const preview = demoLeads.find((l) => l.id === previewId);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const scoreColor = (score: number) =>
    score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-muted-foreground";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Leads</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage prospects before and after AI-assisted discovery calls.
          </p>
        </div>
        <Button onClick={() => onNavigate("new-lead")}>
          <Plus className="w-4 h-4" />
          New Lead
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New Lead</SelectItem>
                <SelectItem value="in_call">In Call</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="needs_review">Needs Review</SelectItem>
                <SelectItem value="unqualified">Disqualified</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Industry" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="dev">Developer Tools</SelectItem>
                <SelectItem value="ecom">E-commerce SaaS</SelectItem>
                <SelectItem value="fin">Fintech</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="any">
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Score" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any score</SelectItem>
                <SelectItem value="80">80+</SelectItem>
                <SelectItem value="60">60+</SelectItem>
                <SelectItem value="0">Unscored</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="recent">
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Last call</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="score">Highest score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selected.length > 0 && (
        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="p-3 flex items-center justify-between">
            <p className="text-sm font-medium">{selected.length} selected</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">Assign Rep</Button>
              <Button size="sm" variant="outline">Change Status</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className={`grid gap-6 ${preview ? "grid-cols-3" : "grid-cols-1"}`}>
        <Card className={preview ? "col-span-2" : ""}>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-3 pl-4 w-8"></th>
                  <th className="py-3 text-sm font-medium text-muted-foreground">Contact</th>
                  <th className="py-3 text-sm font-medium text-muted-foreground">Company</th>
                  <th className="py-3 text-sm font-medium text-muted-foreground">Industry</th>
                  <th className="py-3 text-sm font-medium text-muted-foreground">Use Case</th>
                  <th className="py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="py-3 text-sm font-medium text-muted-foreground">Score</th>
                  <th className="py-3 text-sm font-medium text-muted-foreground">Last Call</th>
                  <th className="py-3 text-sm font-medium text-muted-foreground">Owner</th>
                  <th className="py-3 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => {
                  const status = statusBadge(lead.status);
                  return (
                    <tr
                      key={lead.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer ${
                        previewId === lead.id ? "bg-muted/50" : ""
                      }`}
                      onClick={() => setPreviewId(lead.id)}
                    >
                      <td className="py-4 pl-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.includes(lead.id)}
                          onCheckedChange={() => toggle(lead.id)}
                        />
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                            {lead.contact.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{lead.contact}</p>
                            <p className="text-xs text-muted-foreground">{lead.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-sm">{lead.company}</td>
                      <td className="py-4 text-sm text-muted-foreground">{lead.industry}</td>
                      <td className="py-4 text-sm text-muted-foreground max-w-[180px] truncate">
                        {lead.useCase}
                      </td>
                      <td className="py-4">
                        <Badge variant={status.variant}>
                          {lead.status === "in_call" && <Circle className="w-2 h-2 mr-1 fill-current" />}
                          {status.label}
                        </Badge>
                      </td>
                      <td className="py-4">
                        {lead.score > 0 ? (
                          <span className={`text-sm font-semibold ${scoreColor(lead.score)}`}>{lead.score}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">{lead.lastCall ?? "—"}</td>
                      <td className="py-4 text-sm text-muted-foreground">John Doe</td>
                      <td className="py-4 pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="View Details"
                            onClick={() => onNavigate("lead-detail", lead.id)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Start Call"
                            onClick={() => onNavigate("active-call", lead.id)}>
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="View Handoff"
                            onClick={() => onNavigate("post-call", lead.id)}>
                            <FileText className="w-4 h-4" />
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Lead Preview</CardTitle>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPreviewId(null)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {preview.contact.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{preview.contact}</p>
                  <p className="text-xs text-muted-foreground">{preview.title} · {preview.company}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 py-3 border-y border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Industry</p>
                  <p className="text-sm font-medium">{preview.industry}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className={`text-sm font-semibold ${scoreColor(preview.score)}`}>
                    {preview.score > 0 ? preview.score : "—"}
                  </p>
                </div>
              </div>

              {preview.hypothesis && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <p className="text-xs font-medium text-accent">AI Pre-call Hypothesis</p>
                  </div>
                  <p className="text-sm text-foreground">{preview.hypothesis}</p>
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">Latest Extracted Signals</p>
                </div>
                <ul className="space-y-1 text-sm text-foreground">
                  <li>· Use case: {preview.useCase}</li>
                  <li>· Budget signal: Medium</li>
                  <li>· Urgency: Q2 2026</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="w-3.5 h-3.5 text-accent" />
                  <p className="text-xs font-medium text-accent">Recommended next action</p>
                </div>
                <p className="text-sm">
                  {preview.status === "in_call"
                    ? "Open call room and monitor"
                    : preview.status === "sql" || preview.status === "needs_review"
                    ? "Review post-call handoff"
                    : "Start AI-assisted discovery call"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => onNavigate("lead-detail", preview.id)}>
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
