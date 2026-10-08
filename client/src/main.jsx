import React from "react";
import { hydrateRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./moonlit.css";
const model = JSON.parse(document.getElementById("page-data").textContent);
hydrateRoot(document.getElementById("root"), <App model={model} />);
