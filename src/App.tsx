import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppSidebar from "@/components/AppSidebar";
import FrontDeskPage from "./pages/FrontDeskPage";
import OfficePage from "./pages/OfficePage";
import AgentsPage from "./pages/AgentsPage";
import AgentProfilePage from "./pages/AgentProfilePage";
import AuditPage from "./pages/AuditPage";
import TemplatesPage from "./pages/TemplatesPage";
import SettingsPage from "./pages/SettingsPage";
import CreateAgentPage from "./pages/CreateAgentPage";
import PluginsPage from "./pages/PluginsPage";
import DoneWorkPage from "./pages/DoneWorkPage";
import AgentWelcomePage from "./pages/AgentWelcomePage";
import SecureSetupPage from "./pages/SecureSetupPage";
import SetupPage from "./pages/SetupPage";
import OnboardingPage from "./pages/OnboardingPage";
import ActivityTrustPage from "./pages/ActivityTrustPage";
import NotFound from "./pages/NotFound.tsx";
import { useBackendSync } from "@/hooks/useBackendSync";
import { useSSE } from "@/hooks/useSSE";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="h-screen flex w-full overflow-hidden">
    <AppSidebar />
    <main className="flex-1 overflow-auto">
      {children}
    </main>
  </div>
);

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<AppLayout><FrontDeskPage /></AppLayout>} />
    <Route path="/office" element={<AppLayout><OfficePage /></AppLayout>} />
    <Route path="/front-desk" element={<Navigate to="/" replace />} />
    <Route path="/done-work" element={<AppLayout><DoneWorkPage /></AppLayout>} />
    <Route path="/agents" element={<AppLayout><AgentsPage /></AppLayout>} />
    <Route path="/agents/:id" element={<AppLayout><AgentProfilePage /></AppLayout>} />
    <Route path="/agents/:id/welcome" element={<AgentWelcomePage />} />
    <Route path="/activity" element={<AppLayout><ActivityTrustPage /></AppLayout>} />
    <Route path="/trust" element={<Navigate to="/activity" replace />} />
    <Route path="/audit" element={<AppLayout><AuditPage /></AppLayout>} />
    <Route path="/templates" element={<AppLayout><TemplatesPage /></AppLayout>} />
    <Route path="/connections" element={<AppLayout><PluginsPage /></AppLayout>} />
    <Route path="/plugins" element={<Navigate to="/connections" replace />} />
    <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
    <Route path="/create-agent" element={<AppLayout><CreateAgentPage /></AppLayout>} />
    <Route path="/onboarding" element={<OnboardingPage />} />
    <Route path="/setup" element={<SetupPage />} />
    <Route path="/security-setup" element={<SecureSetupPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const AppBoot = () => {
  useBackendSync();
  useSSE();
  return <AppRoutes />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AppBoot />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
