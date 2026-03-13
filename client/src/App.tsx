import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
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
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/all-gear" component={AllGear} />
      <ProtectedRoute path="/my-gear" component={MyGear} />
      <ProtectedRoute path="/shared-gear" component={SharedGear} />
      <ProtectedRoute path="/checked-out" component={CheckedOutGear} />
      <ProtectedRoute path="/locations" component={Locations} />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route path="/items/:id">
        {(params) => <ItemDetails id={params.id} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
