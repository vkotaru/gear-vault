import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/lib/authContext";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AllGear from "@/pages/AllGear";
import MyGear from "@/pages/MyGear";
import SharedGear from "@/pages/SharedGear";
import CheckedOutGear from "@/pages/CheckedOutGear";
import ItemDetails from "@/pages/ItemDetails";
import Layout from "@/components/layout/Layout";
import { Suspense, lazy } from "react";

// Protected route component
function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return <Component {...rest} />;
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <TooltipProvider>
      <Toaster />
      <Switch>
        <Route path="/login">
          {isAuthenticated ? <Dashboard /> : <Login />}
        </Route>
        <Route path="/">
          <ProtectedRoute component={Dashboard} />
        </Route>
        <Route path="/all-gear">
          <ProtectedRoute component={AllGear} />
        </Route>
        <Route path="/my-gear">
          <ProtectedRoute component={MyGear} />
        </Route>
        <Route path="/shared-gear">
          <ProtectedRoute component={SharedGear} />
        </Route>
        <Route path="/checked-out">
          <ProtectedRoute component={CheckedOutGear} />
        </Route>
        <Route path="/items/:id">
          {(params) => <ProtectedRoute component={ItemDetails} id={params.id} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  );
}

export default App;
