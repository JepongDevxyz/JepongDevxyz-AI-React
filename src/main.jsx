/* main.jsx — entry: providers + <App/>. Imports base CSS + 9 theme files. */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./themes/obsidian-neon.css";
import "./themes/muse-minimal.css";
import "./themes/aurora-glass.css";
import "./themes/midnight-amber.css";
import "./themes/violet-storm.css";
import "./themes/gemini.css";
import "./themes/chatgpt.css";
import "./themes/claude.css";
import "./themes/muse.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
