import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import "./index.css";
import App from "./App.jsx";
import { queryClient } from "./api/apiClient.js";


createRoot(document.getElementById("root")).render(
  // <StrictMode>
  //   <BrowserRouter>
  //     <QueryClientProvider client={queryClient}>
  //       <App />
  //     </QueryClientProvider>
  //   </BrowserRouter>
  // </StrictMode>
  <App/>
);
