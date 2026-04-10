import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppSidebar from "@/components/AppSidebar";
import HomePage from "./pages/HomePage";
import OfficePage from "./pages/OfficePage";
import AgentsPage from "./pages/AgentsPage";
import AgentProfilePage from "./pages/AgentProfilePage";
import ActivityPage from "./pages/ActivityPage";
import AuditPage from "./pages/AuditPage";
import TemplatesPage from "./pages/TemplatesPage";
import SettingsPage from "./pages/SettingsPage";
import TrustCenterPage from "./pages/TrustCenterPage";
import CreateAgentPage from "./pages/CreateAgentPage";
import FrontDeskPage from "./pages/FrontDeskPage";
import PluginsPage from "./pages/PluginsPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import AgentWelcomePage from "./pages/AgentWelcomePage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex w-full">
    <AppSidebar />
    <main className="flex-1 min-h-screen overflow-auto">
      {children}
    </main>
  </div>
);

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
    <Route path="/front-desk" element={<AppLayout><FrontDeskPage /></AppLayout>} />
    <Route path="/approvals" element={<AppLayout><ApprovalsPage /></AppLayout>} />
    <Route path="/office" element={<AppLayout><OfficePage /></AppLayout>} />
    <Route path="/agents" element={<AppLayout><AgentsPage /></AppLayout>} />
    <Route path="/agents/:id" element={<AppLayout><AgentProfilePage /></AppLayout>} />
    <Route path="/agents/:id/welcome" element={<AgentWelcomePage />} />
    <Route path="/activity" element={<AppLayout><ActivityPage /></AppLayout>} />
    <Route path="/audit" element={<AppLayout><AuditPage /></AppLayout>} />
    <Route path="/templates" element={<AppLayout><TemplatesPage /></AppLayout>} />
    <Route path="/plugins" element={<AppLayout><PluginsPage /></AppLayout>} />
    <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
    <Route path="/trust" element={<AppLayout><TrustCenterPage /></AppLayout>} />
    <Route path="/create-agent" element={<AppLayout><CreateAgentPage /></AppLayout>} />
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
