import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";
import "@/styles/global.css";
import "@/styles/tokens.css";

const root = document.getElementById("root");
if (!root) throw new Error("Weather Command root element is missing.");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
