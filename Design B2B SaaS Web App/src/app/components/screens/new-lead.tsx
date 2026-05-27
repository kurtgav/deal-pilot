import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Database,
  Lock,
  Phone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface NewLeadProps {
  onNavigate: (screen: string, leadId?: string) => void;
}

export function NewLead({ onNavigate }: NewLeadProps) {
  const [form, setForm] = useState({
    contact: "",
    company: "",
    industry: "",
    email: "",
    title: "",
    useCase: "",
    source: "",
    priority: "medium",
    hypothesis: "",
    painPoints: "",
    techQuestions: "",
    budget: "",
    urgency: "",
    notes: "",
  });
  const [touched, setTouched] = useState(false);

  const requiredOk = form.contact && form.company && form.industry && form.useCase;

  const update = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [k]: e.target.value });

  const save = (startCall = false) => {
    setTouched(true);
    if (!requiredOk) return;
    toast.success("Lead created successfully.");
    if (startCall) onNavigate("active-call", "1");
    else onNavigate("leads");
  };

  const fieldErr = (v: string) => touched && !v;

  const readiness = [
    { label: "Required fields completed", ok: !!requiredOk, icon: CheckCircle2 },
    { label: "Knowledge base ready", ok: true, icon: Database },
    { label: "AI guardrails active", ok: true, icon: ShieldCheck },
    { label: "Prospect PII not retained unless exported", ok: true, icon: Lock },
  ];

  return (
    <div className="pb-24">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Create New Lead</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add prospect context so DealPilot AI can run a better discovery call.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contact">Contact Name <span className="text-danger">*</span></Label>
                <Input id="contact" value={form.contact} onChange={update("contact")}
                  aria-invalid={fieldErr(form.contact)} />
                {fieldErr(form.contact) && <p className="text-xs text-danger mt-1">Contact name is required</p>}
              </div>
              <div>
                <Label htmlFor="company">Company <span className="text-danger">*</span></Label>
                <Input id="company" value={form.company} onChange={update("company")}
                  aria-invalid={fieldErr(form.company)} />
                {fieldErr(form.company) && <p className="text-xs text-danger mt-1">Company is required</p>}
              </div>
              <div>
                <Label>Industry <span className="text-danger">*</span></Label>
                <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                  <SelectTrigger aria-invalid={fieldErr(form.industry)}>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Developer Tools">Developer Tools</SelectItem>
                    <SelectItem value="E-commerce SaaS">E-commerce SaaS</SelectItem>
                    <SelectItem value="Fintech">Fintech</SelectItem>
                    <SelectItem value="Healthcare SaaS">Healthcare SaaS</SelectItem>
                    <SelectItem value="Data Analytics">Data Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="email">Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="email" type="email" value={form.email} onChange={update("email")} />
              </div>
              <div>
                <Label htmlFor="title">Role / Title <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="title" value={form.title} onChange={update("title")} />
              </div>
              <div>
                <Label htmlFor="useCase">Initial Use Case <span className="text-danger">*</span></Label>
                <Input id="useCase" value={form.useCase} onChange={update("useCase")}
                  aria-invalid={fieldErr(form.useCase)}
                  placeholder="e.g. Multi-vendor marketplace integration" />
                <p className="text-xs text-muted-foreground mt-1">Helps AI tailor discovery questions.</p>
              </div>
              <div>
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                AI Pre-Call Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hyp">Pre-call hypothesis</Label>
                <Textarea id="hyp" rows={3} value={form.hypothesis} onChange={update("hypothesis")}
                  placeholder="Why might this prospect be a fit?" />
                <p className="text-xs text-muted-foreground mt-1">AI uses this to frame the opening of the call.</p>
              </div>
              <div>
                <Label htmlFor="pain">Known pain points</Label>
                <Textarea id="pain" rows={2} value={form.painPoints} onChange={update("painPoints")} />
              </div>
              <div>
                <Label htmlFor="tech">Expected technical questions</Label>
                <Textarea id="tech" rows={2} value={form.techQuestions} onChange={update("techQuestions")} />
              </div>
              <div>
                <Label>Budget signal</Label>
                <Select value={form.budget} onValueChange={(v) => setForm({ ...form, budget: v })}>
                  <SelectTrigger><SelectValue placeholder="Select signal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Unknown</SelectItem>
                    <SelectItem value="low">Low (&lt;$2K/mo)</SelectItem>
                    <SelectItem value="medium">Medium ($2-10K/mo)</SelectItem>
                    <SelectItem value="high">High ($10K+/mo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Urgency</Label>
                <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v })}>
                  <SelectTrigger><SelectValue placeholder="Select urgency" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exploring">Exploring</SelectItem>
                    <SelectItem value="quarter">This quarter</SelectItem>
                    <SelectItem value="immediate">Immediate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" rows={2} value={form.notes} onChange={update("notes")} />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 h-fit sticky top-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent" />
                Call Readiness Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {readiness.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.label} className="flex items-start gap-2.5">
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${r.ok ? "text-success" : "text-muted-foreground"}`} />
                    <span className="text-sm text-foreground">{r.label}</span>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  DealPilot AI never sends emails or writes to CRM without rep approval. AI is grounded to your knowledge base only.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-64 right-0 bg-card border-t border-border p-4 flex items-center justify-between z-10">
        <p className="text-xs text-muted-foreground">
          {requiredOk ? "Ready to save" : "Complete required fields to continue"}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => onNavigate("leads")}>Cancel</Button>
          <Button variant="outline" onClick={() => save(false)} disabled={!requiredOk}>Save Lead</Button>
          <Button onClick={() => save(true)} disabled={!requiredOk}>
            <Phone className="w-4 h-4" />
            Save & Start Voice Sales Call
          </Button>
        </div>
      </div>
    </div>
  );
}
