import { Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import HomePage from "@/pages/HomePage";
import CreateAgentPage from "@/pages/CreateAgentPage";
import AgentsPage from "@/pages/AgentsPage";
import AgentProfilePage from "@/pages/AgentProfilePage";
import OfficePage from "@/pages/OfficePage";
import ActivityPage from "@/pages/ActivityPage";
import SafetyPage from "@/pages/SafetyPage";
import ConnectionsPage from "@/pages/ConnectionsPage";
import SettingsPage from "@/pages/SettingsPage";
import OnboardingFlow from "@/components/OnboardingFlow";
import { useOnboardingStore } from "@/store/onboarding-store";

export default function App() {
  const { completed } = useOnboardingStore();

  return (
    <TooltipProvider>
      {!completed && <OnboardingFlow />}
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateAgentPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/agents/:id" element={<AgentProfilePage />} />
          <Route path="/office" element={<OfficePage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </TooltipProvider>
  );
}
