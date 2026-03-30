import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@xyflow/react/dist/style.css";
import "./index.css";
import Home from "./pages/Home/index.jsx";
import AgentBuilder from "./AgentBuilder/index.jsx";
import SettingsPage from "./pages/Settings/index.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/builder" element={<AgentBuilder />} />
        <Route path="/builder/:flowId" element={<AgentBuilder />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <ToastContainer theme="dark" position="bottom-center" />
    </BrowserRouter>
  </React.StrictMode>
);
