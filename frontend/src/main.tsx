import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ServiceWorkerProvider } from "./hooks/useServiceWorker";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <ServiceWorkerProvider>
        <App />
      </ServiceWorkerProvider>
    </AuthProvider>
  </React.StrictMode>
);
