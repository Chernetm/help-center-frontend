import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";

// Handle chunk load errors to automatically refresh the page after deployment
window.addEventListener('error', (e) => {
  if (e.message?.includes('Importing a zipped bundle') || // Some browsers
    e.message?.includes('Failed to fetch dynamically imported module') || // Chrome
    e.message?.includes('error loading dynamically imported module')) // Firefox
  {
    console.warn("New deployment detected, refreshing...");
    window.location.reload();
  }
}, true);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Navbar />
      <App />

    </BrowserRouter>
  </React.StrictMode>
);
