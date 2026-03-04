import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import LocumDashboard from "./pages/LocumDashboard";
import PracticeDashboard from "./pages/PracticeDashboard";
import PracticeBookings from "./pages/PracticeBookings";
import PracticePayments from "./pages/PracticePayments";
import PracticeSettings from "./pages/PracticeSettings";
import PracticeMessages from "./pages/PracticeMessages";
import FindLocums from "./pages/FindLocums";
import PublicSearch from "./pages/PublicSearch";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSettings from "./pages/admin/Settings";
import { ChatWidget } from "./components/chat/ChatWidget";

const queryClient = new QueryClient();

// Protected route component for admin pages
const ProtectedAdminRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("adminAuthenticated") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

// Component to conditionally render ChatWidget
const ConditionalChatWidget = () => {
  const location = useLocation();

  // Routes where the chat widget should be hidden
  const hiddenRoutes = ["/", "/login", "/register", "/search"];

  // Don't show ChatWidget on admin routes or public pages (landing, login, register)
  if (
    location.pathname.startsWith("/admin") ||
    hiddenRoutes.includes(location.pathname)
  ) {
    return null;
  }
  return <ChatWidget />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<PublicSearch />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin-dashboard/settings"
            element={
              <ProtectedAdminRoute>
                <AdminSettings />
              </ProtectedAdminRoute>
            }
          />
          <Route path="/locum-dashboard/*" element={<LocumDashboard />} />
          <Route path="/practice-dashboard" element={<PracticeDashboard />} />
          <Route
            path="/practice-dashboard/bookings"
            element={<PracticeBookings />}
          />
          <Route
            path="/practice-dashboard/payments"
            element={<PracticePayments />}
          />
          <Route
            path="/practice-dashboard/find-locums"
            element={<FindLocums />}
          />
          <Route
            path="/practice-dashboard/settings"
            element={<PracticeSettings />}
          />
          <Route
            path="/practice-dashboard/messages"
            element={<PracticeMessages />}
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ConditionalChatWidget />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
