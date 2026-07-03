import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import AuthProvider from "./context/AuthContext.jsx";
import Toast from "./components/common/Toast.jsx";
import ActionDialogProvider from "./components/common/ActionDialogProvider.jsx";

createRoot(document.getElementById("root")).render( // Mounts React inside the root element from index.html.
  <BrowserRouter> {/* Enables page navigation without reloading the browser. */}
    <AuthProvider> {/* Shares login state with every component. */}
      <ActionDialogProvider>
        <Toast />
        <App />
      </ActionDialogProvider>
    </AuthProvider>
  </BrowserRouter>,
);
