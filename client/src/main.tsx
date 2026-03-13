import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Apply saved theme settings immediately on load
(() => {
  try {
    const stored = localStorage.getItem("gear-vault-theme");
    if (!stored) return;
    const s = JSON.parse(stored);
    const root = document.documentElement;

    // Font size
    if (s.fontSize) root.style.fontSize = `${s.fontSize}px`;

    // Content width
    if (s.contentWidth) root.style.setProperty("--content-width", `${s.contentWidth}px`);
  } catch {}
})();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
