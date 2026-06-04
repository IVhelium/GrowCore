import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import AuthProvider from "./context/AuthContext.jsx";
import RateLimitNotice from "./components/common/RateLimitNotice.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <RateLimitNotice />
      <App />
    </AuthProvider>
  </BrowserRouter>,
);
