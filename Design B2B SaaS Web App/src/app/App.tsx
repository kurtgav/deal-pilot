import { useState } from "react";
import { Sidebar } from "./components/layout/sidebar";
import { Header } from "./components/layout/header";
import { Dashboard } from "./components/screens/dashboard";
import { LeadDetail } from "./components/screens/lead-detail";
import { ActiveCall } from "./components/screens/active-call";
import { PostCall } from "./components/screens/post-call";
import { ActiveCalls } from "./components/screens/active-calls";
import { Leads } from "./components/screens/leads";
import { Handoffs } from "./components/screens/handoffs";
import { KnowledgeBase } from "./components/screens/knowledge-base";
import { NewLead } from "./components/screens/new-lead";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [activeScreen, setActiveScreen] = useState<string>("dashboard");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const handleNavigate = (screen: string, leadId?: string) => {
    setActiveScreen(screen);
    if (leadId) {
      setSelectedLeadId(leadId);
    }
  };

  const getHeaderTitle = () => {
    switch (activeScreen) {
      case "dashboard":
        return "Dashboard";
      case "active-calls":
        return "Active Calls";
      case "leads":
        return "Leads";
      case "handoffs":
        return "Handoffs";
      case "knowledge-base":
        return "Knowledge Base";
      case "settings":
        return "Settings";
      case "lead-detail":
        return "Lead Detail";
      case "active-call":
        return "Active Call";
      case "post-call":
        return "Post-Call Handoff";
      case "new-lead":
        return "Create New Lead";
      default:
        return "DealPilot AI";
    }
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} />;
      case "active-calls":
        return <ActiveCalls onNavigate={handleNavigate} />;
      case "leads":
        return <Leads onNavigate={handleNavigate} />;
      case "handoffs":
        return <Handoffs onNavigate={handleNavigate} />;
      case "knowledge-base":
        return <KnowledgeBase />;
      case "new-lead":
        return <NewLead onNavigate={handleNavigate} />;
      case "lead-detail":
        return selectedLeadId ? (
          <LeadDetail leadId={selectedLeadId} onNavigate={handleNavigate} />
        ) : (
          <Dashboard onNavigate={handleNavigate} />
        );
      case "active-call":
        return selectedLeadId ? (
          <ActiveCall leadId={selectedLeadId} onNavigate={handleNavigate} />
        ) : (
          <Dashboard onNavigate={handleNavigate} />
        );
      case "post-call":
        return selectedLeadId ? (
          <PostCall leadId={selectedLeadId} onNavigate={handleNavigate} />
        ) : (
          <Dashboard onNavigate={handleNavigate} />
        );
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                {getHeaderTitle()}
              </h2>
              <p className="text-sm text-muted-foreground">This screen is under development</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="size-full flex bg-background">
      <Sidebar activeScreen={activeScreen} onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col min-w-0">
        {activeScreen !== "active-call" && (
          <Header title={getHeaderTitle()} onNewLead={() => handleNavigate("new-lead")} />
        )}
        <main className="flex-1 overflow-auto">
          {renderScreen()}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
