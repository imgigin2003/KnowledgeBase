import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { createPageUrl } from "./utils"; // Adjusted import for utils

import Layout from "./Layout";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import ArticlePage from "./pages/Article"; // Renamed to avoid conflict with entity
import InternTracking from "./pages/InternTracking";

function App() {
  return (
    <Router>
      <Routes>
        {/*
          The Layout component receives `children` prop which will be the matched Route component.
          The `currentPageName` prop is manually passed to the Layout based on the route.
        */}
        <Route path="/" element={<Layout currentPageName="Dashboard" />}>
          {/* Index route for the root path */}
          <Route index element={<Dashboard />} />
        </Route>

        {/* Separate routes for other pages, also wrapped by Layout */}
        <Route
          path={createPageUrl("Dashboard")}
          element={
            <Layout currentPageName="Dashboard">
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path={createPageUrl("Editor")}
          element={
            <Layout currentPageName="Editor">
              <Editor />
            </Layout>
          }
        />
        <Route
          path={createPageUrl("Article")}
          element={
            <Layout currentPageName="Article">
              <ArticlePage />
            </Layout>
          }
        />
        <Route
          path={createPageUrl("InternTracking")}
          element={
            <Layout currentPageName="InternTracking">
              <InternTracking />
            </Layout>
          }
        />

        {/* You can add a 404 Not Found page here if desired */}
        {/* <Route path="*" element={<Layout><NotFoundPage /></Layout>} /> */}
      </Routes>
    </Router>
  );
}

export default App;
