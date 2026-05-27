import { useState } from "react";
import {
  Search,
  Package,
  ShieldCheck,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Database,
  Sparkles,
  FileText,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";

const products = [
  { title: "Growth API Package", category: "Package", source: "Marketing PDF", updated: "2 days ago", grounded: true },
  { title: "Enterprise Webhook Tier", category: "Package", source: "Internal Wiki", updated: "1 wk ago", grounded: true },
  { title: "PCI-DSS Compliance Brief", category: "Compliance", source: "Legal Doc", updated: "1 mo ago", grounded: true },
  { title: "Real-time Sync Architecture", category: "Technical", source: "Engineering Doc", updated: "5 days ago", grounded: true },
];

const objections = [
  {
    objection: "Concerned about integration time",
    response:
      "Our managed connectors typically reduce integration time from weeks to days. Most customers go live within 5-10 business days with our Growth package.",
    escalate: "If timeline pressure exceeds standard SLA",
  },
  {
    objection: "Worried about API complexity",
    response:
      "We support 200+ API patterns including non-standard auth and rate-limiting. For unusual cases we offer a free architectural review.",
    escalate: "Custom enterprise API patterns",
  },
  {
    objection: "Pricing comparison vs Zapier/Make",
    response:
      "We're positioned for B2B complexity, not consumer flows. Pricing reflects enterprise SLAs, compliance, and webhook management.",
    escalate: "Custom pricing requests",
  },
];

const escalationRules = [
  { label: "Unknown pricing", icon: AlertTriangle },
  { label: "SLA guarantee", icon: ShieldCheck },
  { label: "Legal terms", icon: FileText },
  { label: "Unsupported integration", icon: Layers },
  { label: "Custom enterprise commitments", icon: AlertTriangle },
];

export function KnowledgeBase() {
  const [tab, setTab] = useState("products");

  const status = [
    { label: "Product Catalog", value: "Loaded", icon: Package, ok: true },
    { label: "Objection Library", value: "Loaded", icon: ShieldCheck, ok: true },
    { label: "Discovery Questions", value: "Loaded", icon: HelpCircle, ok: true },
    { label: "Grounding Coverage", value: "94%", icon: Database, ok: true },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Knowledge Base</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Grounded product, package, objection, and discovery content used by DealPilot AI.
          </p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search knowledge base..." className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {status.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <h3 className="text-xl font-semibold">{s.value}</h3>
                    </div>
                  </div>
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-accent/5 border-accent/20">
        <CardContent className="p-4 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-accent mt-0.5 shrink-0" />
          <p className="text-sm text-foreground">
            AI will only answer from grounded content. Unknown questions are flagged for human follow-up.
          </p>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="products">Product Catalog</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="use-cases">Use Cases</TabsTrigger>
          <TabsTrigger value="objections">Objections</TabsTrigger>
          <TabsTrigger value="discovery">Discovery Questions</TabsTrigger>
          <TabsTrigger value="escalation">Escalation Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-3 pl-4 text-sm font-medium text-muted-foreground">Title</th>
                    <th className="py-3 text-sm font-medium text-muted-foreground">Category</th>
                    <th className="py-3 text-sm font-medium text-muted-foreground">Source</th>
                    <th className="py-3 text-sm font-medium text-muted-foreground">Last Updated</th>
                    <th className="py-3 pr-4 text-sm font-medium text-muted-foreground">Grounding</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.title} className="border-b border-border last:border-0">
                      <td className="py-4 pl-4 text-sm font-medium">{p.title}</td>
                      <td className="py-4 text-sm text-muted-foreground">{p.category}</td>
                      <td className="py-4 text-sm text-muted-foreground">{p.source}</td>
                      <td className="py-4 text-sm text-muted-foreground">{p.updated}</td>
                      <td className="py-4 pr-4">
                        <Badge variant={p.grounded ? "success" : "warning"}>
                          {p.grounded ? "Grounded" : "Stale"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="mt-4">
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Package definitions and pricing tiers are managed by Revenue Ops.</CardContent></Card>
        </TabsContent>

        <TabsContent value="use-cases" className="mt-4">
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Canonical use case write-ups used by AI to match prospects to fit.</CardContent></Card>
        </TabsContent>

        <TabsContent value="objections" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            {objections.map((o) => (
              <Card key={o.objection}>
                <CardHeader>
                  <CardTitle className="text-base flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    {o.objection}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Approved response</p>
                    <p className="text-sm">{o.response}</p>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Escalation condition</p>
                    <p className="text-sm text-foreground">{o.escalate}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="discovery" className="mt-4">
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Curated discovery question bank by industry vertical.</CardContent></Card>
        </TabsContent>

        <TabsContent value="escalation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Always escalate to human</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {escalationRules.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.label} className="flex items-center gap-2.5 p-3 rounded-lg border border-border">
                    <Icon className="w-4 h-4 text-warning" />
                    <span className="text-sm">{r.label}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
