import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import "../styles/Layout.css"; // Make sure to create this CSS file

function Layout() {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;