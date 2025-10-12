import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Article } from "@/entities/Article";
import { Categories } from "@/entities/Categories";
import {
  BookOpen,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  Home,
  GraduationCap,
  Building,
  BrainCircuit,
  ClipboardList,
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

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [articles, setArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);

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

    // refresh when article published or category updated
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
      setExpandedFolders(new Set());
    }
  }, [searchTerm, filteredArticles]);

  const buildTree = (articlesList, categoriesList) => {
    const root = { children: {}, articles: [] };

    // add category path
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

    // add every category (even the empty ones)
    categoriesList.forEach((cat) => {
      addCategoryPath(cat.name);
      const addSubcats = (subcats, basePath) => {
        subcats?.forEach((sub) => {
          const subPath = `${basePath}/${sub.name}`;
          addCategoryPath(subPath);
          if (sub.subcategories?.length) addSubcats(sub.subcategories, subPath);
        });
      };
      if (cat.subcategories?.length) addSubcats(cat.subcategories, cat.name);
    });

    // add articles in step 2
    articlesList.forEach((article) => {
      let paths =
        article.categories || (article.category ? [article.category] : []);
      if (paths.length === 0) {
        if (!root.articles.some((a) => a.id === article.id)) {
          root.articles.push(article);
        }
      } else {
        paths.forEach((path) => {
          addCategoryPath(path);
          let current = root;
          path
            .split("/")
            .filter(Boolean)
            .forEach((folderName) => {
              current = current.children[folderName];
            });
          if (!current.articles.some((a) => a.id === article.id)) {
            current.articles.push(article);
          }
        });
      }
    });

    return root;
  };

  const tree = React.useMemo(() => {
    if (searchTerm) {
      return buildTree(filteredArticles, []);
    }
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
    const folderEntries = Object.entries(node.children);
    const folderItems = folderEntries.map(([key, child]) => {
      const currentPath = [...path, key];
      const pathString = currentPath.join("/");
      const isExpanded = expandedFolders.has(pathString);

      return (
        <div key={key}>
          <button
            onClick={() => toggleFolder(pathString)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <Folder className="w-5 h-5 text-slate-600" />
            <span className="flex-1 text-left">{key}</span>
          </button>
          {isExpanded && (
            <div className="ml-6 border-l border-slate-200 pl-2">
              {renderNode(child, currentPath)}
            </div>
          )}
        </div>
      );
    });

    const articleItems = node.articles.map((article) => (
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

  // If it's an editor page, return children without sidebar
  if (isEditorPage) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        <Sidebar className="border-r border-slate-200 bg-white">
          <SidebarHeader className="border-b border-slate-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">
                  KnowledgeBase
                </h2>
                <p className="text-xs text-slate-500">Internal Documentation</p>
              </div>
            </div>
          </SidebarHeader>

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
                        location.pathname === createPageUrl("Dashboard")
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
                        location.pathname === createPageUrl("InternTracking")
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
        </Sidebar>

        <main className="flex-1 flex flex-col">
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
  );
}
