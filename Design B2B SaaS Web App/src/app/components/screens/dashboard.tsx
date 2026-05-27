import { TrendingUp, Phone, Star, AlertCircle, ArrowRight, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { demoLeads, type Lead } from "../../data/demo-data";

interface DashboardProps {
  onNavigate: (screen: string, leadId?: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const metrics = [
    { label: "New Leads", value: "12", change: "+3 today", icon: TrendingUp, color: "text-primary" },
    { label: "In Call", value: "1", change: "Live now", icon: Phone, color: "text-accent" },
    { label: "SQL Candidates", value: "8", change: "This week", icon: Star, color: "text-success" },
    { label: "Needs Review", value: "3", change: "Pending", icon: AlertCircle, color: "text-warning" },
  ];

  const getStatusBadgeVariant = (status: Lead["status"]) => {
    switch (status) {
      case "new":
        return "default";
      case "contacted":
        return "secondary";
      case "in_call":
        return "live";
      case "sql":
        return "success";
      case "needs_review":
        return "warning";
      case "qualified":
        return "success";
      case "unqualified":
        return "destructive";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: Lead["status"]) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-muted-foreground";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <h3 className="text-3xl font-semibold mt-2">{metric.value}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{metric.change}</p>
                  </div>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Contact</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Company</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Industry</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Use Case</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Score</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Last Call</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {demoLeads.map((lead, index) => (
                  <tr
                    key={lead.id}
                    className={`border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors ${
                      lead.status === "in_call" ? "bg-accent/5" : ""
                    }`}
                    onClick={() => {
                      if (lead.status === "in_call") {
                        onNavigate("active-call", lead.id);
                      } else if (lead.status === "sql" || lead.status === "needs_review") {
                        onNavigate("post-call", lead.id);
                      } else {
                        onNavigate("lead-detail", lead.id);
                      }
                    }}
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                          {lead.contact.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{lead.contact}</p>
                          <p className="text-xs text-muted-foreground">{lead.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-foreground">{lead.company}</td>
                    <td className="py-4 text-sm text-muted-foreground">{lead.industry}</td>
                    <td className="py-4 text-sm text-muted-foreground max-w-xs truncate">
                      {lead.useCase}
                    </td>
                    <td className="py-4">
                      <Badge variant={getStatusBadgeVariant(lead.status)}>
                        {lead.status === "in_call" && (
                          <Circle className="w-2 h-2 mr-1 fill-current" />
                        )}
                        {getStatusLabel(lead.status)}
                      </Badge>
                    </td>
                    <td className="py-4">
                      {lead.score > 0 ? (
                        <span className={`text-sm font-semibold ${getScoreColor(lead.score)}`}>
                          {lead.score}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">
                      {lead.lastCall || "—"}
                    </td>
                    <td className="py-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
