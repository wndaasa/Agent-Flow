import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@xyflow/react/dist/style.css";
import "./index.css";
import AgentBuilder from "./AgentBuilder/index.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/builder" replace />} />
        <Route path="/builder" element={<AgentBuilder />} />
        <Route path="/builder/:flowId" element={<AgentBuilder />} />
      </Routes>
      <ToastContainer theme="light" position="bottom-center" />
    </BrowserRouter>
  </React.StrictMode>
);
