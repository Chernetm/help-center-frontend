import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";

// Detect new deployment by checking script hashes in index.html
async function checkNewVersion() {
  try {
    const res = await fetch('/index.html?t=' + Date.now(), { cache: 'no-store' });
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const newScripts = Array.from(doc.querySelectorAll('script[src]')).map(s => s.getAttribute('src'));
    const currentScripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.getAttribute('src'));

    if (newScripts.length > 0 && JSON.stringify(newScripts) !== JSON.stringify(currentScripts)) {
      console.log("New version detected by script comparison. Refreshing...");
      window.location.reload();
    }
  } catch (e) {
    console.warn("Version check failed", e);
  }
}

// Check every 60 seconds
setInterval(checkNewVersion, 60000);

// Handle chunk load errors to automatically refresh the page after deployment
window.addEventListener('error', (e) => {
  if (e.message?.includes('Importing a zipped bundle') || // Some browsers
    e.message?.includes('Failed to fetch dynamically imported module') || // Chrome
    e.message?.includes('error loading dynamically imported module')) // Firefox
  {
    console.warn("New deployment detected via chunk error, refreshing...");
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
