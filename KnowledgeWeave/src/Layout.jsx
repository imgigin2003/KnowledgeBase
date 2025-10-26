import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Article } from "@/entities/Article";
import { Categories } from "@/entities/Categories";
import {
  CheckSquare,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  Home,
  BrainCircuit,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [articles, setArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(new Set()); // Changed from expandedCategories
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]); // New state for categories
  const [sidebarWidth, setSidebarWidth] = useState(280); // Default sidebar width
  const [isResizing, setIsResizing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Hide sidebar for editor pages
  const isEditorPage = currentPageName === "Editor";

  const loadArticles = async () => {
    try {
      const data = await Article.list("-updated_date");
      setArticles(data || []);
    } catch (error) {
      console.error("Error loading articles:", error);
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await Categories.list();
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]);
    }
  };

  useEffect(() => {
    loadArticles();
    loadCategories();

    const handleDataChanged = () => {
      loadArticles();
      loadCategories();
    };

    window.addEventListener("articlePublished", handleDataChanged);
    window.addEventListener("articleDeleted", handleDataChanged);
    window.addEventListener("categoryUpdated", handleDataChanged);
    window.addEventListener("categoryDeleted", handleDataChanged);

    return () => {
      window.removeEventListener("articlePublished", handleDataChanged);
      window.removeEventListener("articleDeleted", handleDataChanged);
      window.removeEventListener("categoryUpdated", handleDataChanged);
      window.removeEventListener("categoryDeleted", handleDataChanged);
    };
  }, []);

  const filteredArticles = React.useMemo(() => {
    if (!searchTerm) return articles;
    return articles.filter(
      (article) =>
        article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.tags?.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  }, [articles, searchTerm]);

  // Effect to expand folders when searching
  useEffect(() => {
    if (searchTerm) {
      const allPaths = new Set();
      filteredArticles.forEach((article) => {
        (article.categories || []).forEach((cat) => {
          const parts = cat.split("/");
          for (let i = 1; i <= parts.length; i++) {
            allPaths.add(parts.slice(0, i).join("/"));
          }
        });
      });
      setExpandedFolders(allPaths);
    } else {
      setExpandedFolders(new Set()); // Reset expanded folders when search is cleared
    }
  }, [searchTerm, filteredArticles]);

  // Resize handlers
  const startResizing = (e) => {
    e.preventDefault(); // Prevent default behavior
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing) {
        const newWidth = e.clientX;
        // Enforce min/max width for sidebar
        if (newWidth >= 300 && newWidth <= 800) {
          setSidebarWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = ""; // Reset user selection
      document.body.style.cursor = ""; // Reset cursor
    };

    if (isResizing) {
      document.body.style.userSelect = "none"; // Prevent text selection
      document.body.style.cursor = "col-resize"; // Show resize cursor everywhere
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = ""; // Ensure cleanup
      document.body.style.cursor = ""; // Ensure cleanup
    };
  }, [isResizing]);

  // --- Tree-like structure and rendering for Knowledge Base ---
  const buildTree = (articlesList, categoriesList) => {
    const root = { children: {}, articles: [] };

    // Function to add a category path to the tree
    const addCategoryPath = (path) => {
      let current = root;
      path
        .split("/")
        .filter(Boolean)
        .forEach((folderName) => {
          if (!current.children[folderName]) {
            current.children[folderName] = { children: {}, articles: [] };
          }
          current = current.children[folderName];
        });
    };

    // Add all defined categories (and their subcategories) to the tree structure
    categoriesList.forEach((cat) => {
      addCategoryPath(cat.name); // Add top-level category
      const addSubcats = (subcats, basePath) => {
        subcats?.forEach((sub) => {
          const subPath = `${basePath}/${sub.name}`;
          addCategoryPath(subPath);
          if (sub.subcategories?.length) addSubcats(sub.subcategories, subPath);
        });
      };
      if (cat.subcategories?.length) addSubcats(cat.subcategories, cat.name);
    });

    // Add articles to their respective category paths
    articlesList.forEach((article) => {
      let paths =
        article.categories || (article.category ? [article.category] : []);
      if (paths.length === 0) {
        // Articles without explicit categories go to the root
        if (!root.articles.some((a) => a.id === article.id)) {
          root.articles.push(article);
        }
      } else {
        paths.forEach((path) => {
          addCategoryPath(path); // Ensure the path exists
          let current = root;
          path
            .split("/")
            .filter(Boolean)
            .forEach((folderName) => {
              current = current.children[folderName];
            });
          // Add article to the specific folder node, avoiding duplicates
          if (!current.articles.some((a) => a.id === article.id)) {
            current.articles.push(article);
          }
        });
      }
    });

    return root;
  };

  const tree = React.useMemo(() => {
    // If searching, only build tree from filtered articles, without considering full category structure
    if (searchTerm) {
      return buildTree(filteredArticles, []);
    }
    // Otherwise, build from all articles and full category structure
    return buildTree(articles, categories);
  }, [filteredArticles, articles, categories, searchTerm]);

  const toggleFolder = (pathString) => {
    setExpandedFolders((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(pathString)) {
        newExpanded.delete(pathString);
      } else {
        newExpanded.add(pathString);
      }
      return newExpanded;
    });
  };

  const renderNode = (node, path = []) => {
    const folderEntries = Object.entries(node.children).sort(([keyA], [keyB]) =>
      keyA.localeCompare(keyB)
    ); // Sort folders alphabetically
    const articleEntries = [...node.articles].sort((a, b) =>
      a.title.localeCompare(b.title)
    ); // Sort articles alphabetically

    const folderItems = folderEntries.map(([key, child]) => {
      const currentPath = [...path, key];
      const pathString = currentPath.join("/");
      const isExpanded = expandedFolders.has(pathString) || searchTerm; // Always expanded if searching

      const folderArticleCount = (node) => {
        let count = node.articles.length;
        for (const childKey in node.children) {
          count += folderArticleCount(node.children[childKey]);
        }
        return count;
      };
      const totalArticlesInFolder = folderArticleCount(child);

      return (
        <div key={key}>
          <button
            onClick={() => toggleFolder(pathString)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            )}
            <Folder className="w-5 h-5 text-slate-600 flex-shrink-0" />
            <span className="flex-1 text-left truncate">{key}</span>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full flex-shrink-0">
              {totalArticlesInFolder}
            </span>
          </button>
          {isExpanded && (
            <div className="ml-6 border-l border-slate-200 pl-2">
              {renderNode(child, currentPath)}
            </div>
          )}
        </div>
      );
    });

    const articleItems = articleEntries.map((article) => (
      <Link
        key={article.id}
        to={createPageUrl(`Article?id=${article.id}`)}
        className="block px-3 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors ml-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
            <FileText className="w-5 h-5 text-slate-600" />
          </div>
          <span className="truncate">{article.title}</span>
        </div>
      </Link>
    ));

    return [...folderItems, ...articleItems];
  };
  // --- End Tree-like structure and rendering ---

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-slate-50">
          {!isEditorPage && (
            <div
              className="relative border-r border-slate-200 bg-white flex-shrink-0"
              style={{
                width: isSidebarCollapsed ? "60px" : `${sidebarWidth}px`,
                transition: isResizing ? "none" : "width 0.3s ease", // Disable transition during resize
              }}
            >
              <Sidebar className="border-none w-full h-full">
                {" "}
                {/* Remove border-r from Sidebar */}
                <SidebarHeader
                  className={`border-b border-slate-100 p-6 ${
                    isSidebarCollapsed ? "justify-center p-4" : ""
                  }`}
                >
                  {!isSidebarCollapsed ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BrainCircuit className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-900 text-lg">
                          KnowledgeBase
                        </h2>
                        <p className="text-xs text-slate-500">
                          Internal Documentation
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BrainCircuit className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                </SidebarHeader>
                {!isSidebarCollapsed && (
                  <>
                    <SidebarContent className="p-4">
                      <div className="mb-6">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            placeholder="Search articles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 border-slate-200 focus:border-slate-400"
                          />
                        </div>
                      </div>
                      <SidebarGroup>
                        <SidebarGroupContent>
                          <SidebarMenu>
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                asChild
                                className={`hover:bg-slate-100 transition-colors mb-2 ${
                                  location.pathname ===
                                  createPageUrl("Dashboard")
                                    ? "bg-slate-100"
                                    : ""
                                }`}
                              >
                                <Link
                                  to={createPageUrl("Dashboard")}
                                  className="flex flex-row items-center gap-2 w-full px-3 py-2"
                                >
                                  <Home className="w-5 h-5 flex-shrink-0" />
                                  <span className="font-medium whitespace-nowrap">
                                    Dashboard
                                  </span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                asChild
                                className={`hover:bg-slate-100 transition-colors mb-2 ${
                                  location.pathname ===
                                  createPageUrl("InternTracking")
                                    ? "bg-slate-100"
                                    : ""
                                }`}
                              >
                                <Link
                                  to={createPageUrl("InternTracking")}
                                  className="flex flex-row items-center justify-start gap-3 w-full px-3 py-2"
                                >
                                  <ClipboardList className="w-5 h-5 flex-shrink-0" />
                                  <span className="font-medium whitespace-nowrap">
                                    Intern Tracking
                                  </span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                asChild
                                className={`hover:bg-slate-100 transition-colors mb-2 ${
                                  location.pathname ===
                                  createPageUrl("TaskManager")
                                    ? "bg-slate-100"
                                    : ""
                                }`}
                              >
                                <Link
                                  to={createPageUrl("TaskManager")}
                                  className="flex items-center gap-3 px-3 py-2"
                                >
                                  <CheckSquare className="w-4 h-4 flex-shrink-0" />
                                  <span className="font-medium">
                                    Task Manager
                                  </span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          </SidebarMenu>
                        </SidebarGroupContent>
                      </SidebarGroup>
                      <SidebarGroup>
                        <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-2 mb-3">
                          Knowledge Base
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                          {isLoading ? (
                            <div className="px-3 py-4 text-sm text-slate-500">
                              Loading articles...
                            </div>
                          ) : (
                            <div className="space-y-1">{renderNode(tree)}</div>
                          )}
                        </SidebarGroupContent>
                      </SidebarGroup>
                    </SidebarContent>
                    <SidebarFooter className="border-t border-slate-100 p-4">
                      <Link to={createPageUrl("Editor")} className="w-full">
                        <Button className="w-full bg-slate-800 hover:bg-slate-900 text-white">
                          <Plus className="w-4 h-4 mr-2" />
                          New Article
                        </Button>
                      </Link>
                    </SidebarFooter>
                  </>
                )}
                {isSidebarCollapsed && (
                  <>
                    <SidebarContent className="p-2 flex flex-col items-center space-y-4 overflow-hidden">
                      <Link
                        to={createPageUrl("Dashboard")}
                        className={`p-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0 ${
                          location.pathname === createPageUrl("Dashboard")
                            ? "bg-slate-100"
                            : ""
                        }`}
                        title="Dashboard"
                      >
                        <Home className="w-5 h-5 flex-shrink-0" />
                      </Link>
                      <Link
                        to={createPageUrl("InternTracking")}
                        className={`p-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0 ${
                          location.pathname === createPageUrl("InternTracking")
                            ? "bg-slate-100"
                            : ""
                        }`}
                        title="Intern Tracking"
                      >
                        <ClipboardList className="w-5 h-5 flex-shrink-0" />
                      </Link>
                      <Link
                        to={createPageUrl("TaskManager")}
                        className={`p-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0 ${
                          location.pathname === createPageUrl("TaskManager")
                            ? "bg-slate-100"
                            : ""
                        }`}
                        title="Task Manager"
                      >
                        <CheckSquare className="w-5 h-5 flex-shrink-0" />
                      </Link>
                      <Link
                        to={createPageUrl("Editor")}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors mt-auto flex-shrink-0"
                        title="New Article"
                      >
                        <Plus className="w-5 h-5 flex-shrink-0" />
                      </Link>
                    </SidebarContent>
                  </>
                )}
              </Sidebar>

              {/* Collapse/Expand Button */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="absolute top-4 -right-3 z-50 bg-white border border-slate-200 rounded-full p-5 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all focus:outline-none"
                title={
                  isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-6 h-6 text-slate-600" />
                ) : (
                  <PanelLeftClose className="w-6 h-6 text-slate-600" />
                )}
              </button>

              {/* Resize Handle */}
              {!isSidebarCollapsed && (
                <div
                  className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-400 transition-colors duration-150 z-10"
                  onMouseDown={startResizing}
                  title="Drag to resize"
                >
                  <div className="absolute inset-y-0 -left-1 -right-1" />{" "}
                  {/* Larger hover area */}
                </div>
              )}
            </div>
          )}
          <main
            className={`flex-1 flex flex-col ${isEditorPage ? "w-full" : ""}`}
          >
            <header className="bg-white border-b border-slate-200 px-6 py-4 md:hidden">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors" />
                <h1 className="text-xl font-semibold">KnowledgeBase</h1>
              </div>
            </header>

            <div className="flex-1 overflow-auto bg-slate-50">{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </QueryClientProvider>
  );
}
