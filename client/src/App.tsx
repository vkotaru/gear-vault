import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { useThemeSettings } from "@/hooks/use-theme-settings";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/Dashboard";
import EditItem from "@/pages/EditItem";
import ImportGear from "@/pages/ImportGear";
import AllGear from "@/pages/AllGear";
import MyGear from "@/pages/MyGear";
import SharedGear from "@/pages/SharedGear";
import CheckedOutGear from "@/pages/CheckedOutGear";
import ItemDetails from "@/pages/ItemDetails";
import Locations from "@/pages/Locations";
import Settings from "@/pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/all-gear" component={AllGear} />
      <ProtectedRoute path="/my-gear" component={MyGear} />
      <ProtectedRoute path="/shared-gear" component={SharedGear} />
      <ProtectedRoute path="/checked-out" component={CheckedOutGear} />
      <ProtectedRoute path="/locations" component={Locations} />
      <ProtectedRoute path="/import" component={ImportGear} />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route path="/items/:id/edit">
        {(params) => <EditItem id={params.id} />}
      </Route>
      <Route path="/items/:id">
        {(params) => <ItemDetails id={params.id} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Apply saved theme settings on mount
  useThemeSettings();

  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
