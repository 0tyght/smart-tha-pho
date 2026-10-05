import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { WASTE_PAGE_IDS } from "./WasteManagementApp.jsx";
import { createWasteApplicationController } from "./composition-root/createWasteApplicationController.js";
import "@smart-thapho/web-core/theme.css";

const applicationController = createWasteApplicationController(WASTE_PAGE_IDS);

createRoot(document.getElementById("root")).render(<React.StrictMode><App applicationController={applicationController} /></React.StrictMode>);
