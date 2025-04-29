import { Route } from "wouter";

// This is a simplified version that bypasses authentication
// All routes are automatically accessible without login
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  // Always render the component directly without auth checks
  return <Route path={path} component={Component} />;
}