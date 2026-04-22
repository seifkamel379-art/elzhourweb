import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ensureServiceWorker } from "./lib/notifications";

ensureServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
