import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { AuthProvider } from "@/modules/auth/context/AuthContext";
import { I18nProvider } from "@/shared/i18n/I18nProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <I18nProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </I18nProvider>
);
