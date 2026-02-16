import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ProfileSetup from "@/pages/profile-setup";
import LabEntry from "@/pages/lab-entry";
import ProgramView from "@/pages/program-view";
import NotFound from "@/pages/not-found";
import { Header } from "@/components/header";
import { Loader2 } from "lucide-react";

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <Dashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthGate} />
      <Route path="/profile" component={ProfileSetup} />
      <Route path="/labs/new" component={LabEntry} />
      <Route path="/program/:labId" component={ProgramView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Toaster />
          <Router />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
