import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { createPageUrl } from "./utils";

import Layout from "./Layout";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import ArticlePage from "./pages/Article";
import InternTracking from "./pages/InternTracking";
import TaskManager from "./pages/TaskManager";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout currentPageName="Dashboard" />}>
          {/* Index route for the root path */}
          <Route index element={<Dashboard />} />
        </Route>
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
        <Route
          path={createPageUrl("TaskManager")}
          element={
            <Layout currentPageName="TaskManager">
              <TaskManager />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
