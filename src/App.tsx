import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppSidebar from "@/components/AppSidebar";
import OfficePage from "./pages/OfficePage";
import AgentsPage from "./pages/AgentsPage";
import AgentProfilePage from "./pages/AgentProfilePage";
import AuditPage from "./pages/AuditPage";
import TemplatesPage from "./pages/TemplatesPage";
import SettingsPage from "./pages/SettingsPage";
import CreateAgentPage from "./pages/CreateAgentPage";
import FrontDeskPage from "./pages/FrontDeskPage";
import PluginsPage from "./pages/PluginsPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import AgentWelcomePage from "./pages/AgentWelcomePage";
import SecureSetupPage from "./pages/SecureSetupPage";
import ActivityTrustPage from "./pages/ActivityTrustPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

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
    <Route path="/front-desk" element={<Navigate to="/" replace />} />
    <Route path="/approvals" element={<AppLayout><ApprovalsPage /></AppLayout>} />
    <Route path="/office" element={<AppLayout><OfficePage /></AppLayout>} />
    <Route path="/agents" element={<AppLayout><AgentsPage /></AppLayout>} />
    <Route path="/agents/:id" element={<AppLayout><AgentProfilePage /></AppLayout>} />
    <Route path="/agents/:id/welcome" element={<AgentWelcomePage />} />
    <Route path="/activity" element={<AppLayout><ActivityTrustPage /></AppLayout>} />
    <Route path="/trust" element={<Navigate to="/activity" replace />} />
    <Route path="/audit" element={<AppLayout><AuditPage /></AppLayout>} />
    <Route path="/templates" element={<AppLayout><TemplatesPage /></AppLayout>} />
    <Route path="/plugins" element={<AppLayout><PluginsPage /></AppLayout>} />
    <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
    <Route path="/create-agent" element={<AppLayout><CreateAgentPage /></AppLayout>} />
    <Route path="/setup" element={<SecureSetupPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
