import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@xyflow/react/dist/style.css";
import "./index.css";
import { applyTheme, getTheme } from "./utils/theme.js";
import Home from "./pages/Home/index.jsx";
import AgentBuilder from "./AgentBuilder/index.jsx";
import SettingsPage from "./pages/Settings/index.jsx";

// 저장된 테마를 렌더 전에 DOM에 적용 (깜빡임 방지)
applyTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/builder" element={<AgentBuilder />} />
        <Route path="/builder/:flowId" element={<AgentBuilder />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <ToastContainer theme={getTheme() === "dark" ? "dark" : "light"} position="bottom-center" />
    </BrowserRouter>
  </React.StrictMode>
);
