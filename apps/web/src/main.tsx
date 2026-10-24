import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App, { AppErrorBoundary, configureAppRuntime } from "@helbaron/app";
import "@helbaron/app/styles.css";
import { createWebRuntime } from "./runtime";

configureAppRuntime(createWebRuntime());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);
