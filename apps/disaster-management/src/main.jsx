import React from "react";
import { createRoot } from "react-dom/client";
import App from "./presentation/DisasterOperationsApp.jsx";
import { createDisasterApplication } from "./composition-root/createDisasterApplication.js";
import "@smart-thapho/web-core/theme.css";
const application = createDisasterApplication();
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App {...application} />
  </React.StrictMode>,
);
