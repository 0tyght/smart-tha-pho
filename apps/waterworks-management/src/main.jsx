import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { createWaterworksApplication } from "./composition-root/createWaterworksApplication.js";
import "@smart-thapho/web-core/theme.css";

const controller = createWaterworksApplication();
createRoot(document.getElementById("root")).render(<React.StrictMode><App controller={controller} /></React.StrictMode>);
