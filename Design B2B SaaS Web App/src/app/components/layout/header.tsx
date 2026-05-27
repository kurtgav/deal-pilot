import { Search, Plus, Circle } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface HeaderProps {
  title: string;
  showDemo?: boolean;
  onNewLead?: () => void;
}

export function Header({ title, showDemo = true, onNewLead }: HeaderProps) {
  return (
    <div className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {showDemo && (
          <Badge variant="outline" className="text-xs">
            DEMO MODE
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads..."
            className="w-64 h-9 pl-9 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Button size="sm" className="gap-2" onClick={onNewLead}>
          <Plus className="w-4 h-4" />
          New Lead
        </Button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
          <Circle className="w-2 h-2 fill-success text-success" />
          <span className="text-xs font-medium text-success">Voice engine ready</span>
        </div>
      </div>
    </div>
  );
}
