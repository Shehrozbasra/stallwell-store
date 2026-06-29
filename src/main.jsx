import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Storefront from "./Storefront.jsx";
import SellerDashboard from "./SellerDashboard.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Storefront />} />
        <Route path="/seller" element={<SellerDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
