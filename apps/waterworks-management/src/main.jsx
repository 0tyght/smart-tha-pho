import React from "react";
import { createRoot } from "react-dom/client";
import App from "./presentation/WaterOperationsApp.jsx";
import { createWaterworksApplication } from "./composition-root/createWaterworksApplication.js";
import { createWaterBillingApplication } from "./composition-root/createWaterBillingApplication.js";
import "@smart-thapho/web-core/theme.css";

const controller = createWaterworksApplication();
const billing = createWaterBillingApplication();
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App controller={controller} billing={billing} />
  </React.StrictMode>,
);
