
import { SupabaseAuthProvider } from "./context/SupabaseAuthContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import Login from "@/pages/Login";
import OrderDetail from "@/pages/OrderDetail";
import AdminPanel from "@/pages/AdminPanel";
import Profile from "@/pages/Profile";
import CreateUser from "@/pages/CreateUser";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SupabaseAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/orders/:orderId" element={<OrderDetail />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>
            
            <Route element={<ProtectedRoute requireAdmin />}>
              <Route element={<Layout />}>
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/create-user" element={<CreateUser />} />
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SupabaseAuthProvider>
  </QueryClientProvider>
);

export default App;
