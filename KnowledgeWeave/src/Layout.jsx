import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Article } from "@/entities/Article";

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

const categoryIcons = {
  documentation: FileText,
  research: BookOpen,
  tutorials: GraduationCap,
  references: BookOpen,
  projects: Building,
  processes: Folder,
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [articles, setArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState(
    new Set(["documentation"])
  );
  const [isLoading, setIsLoading] = useState(true);

  // Hide sidebar for editor pages
  const isEditorPage = currentPageName === "Editor";

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const data = await Article.list("-updated_date");
        setArticles(data);
      } catch (error) {
        console.error("Error loading articles:", error);
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadArticles();
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

  const groupedArticles = React.useMemo(() => {
    return filteredArticles.reduce((groups, article) => {
      const category = article.category || "documentation";
      if (!groups[category]) groups[category] = [];
      groups[category].push(article);
      return groups;
    }, {});
  }, [filteredArticles]);

  const toggleCategory = (category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
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
                          <Home className="w-5 h-5 flex-shrink-50" />
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
                  <div className="space-y-2">
                    {Object.entries(groupedArticles).map(
                      ([category, categoryArticles]) => {
                        const Icon = categoryIcons[category] || FileText;
                        const isExpanded = expandedCategories.has(category);

                        return (
                          <div key={category} className="space-y-1">
                            <button
                              onClick={() => toggleCategory(category)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border-b border-slate-100"
                            >
                              <Icon className="w-5 h-5 text-slate-600" />
                              <span className="capitalize flex-1 text-left">
                                {category}
                              </span>
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                {categoryArticles.length}
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="ml-6 space-y-0.5 pb-2">
                                {categoryArticles.map((article) => (
                                  <Link
                                    key={article.id}
                                    to={createPageUrl(
                                      `Article?id=${article.id}`
                                    )}
                                    className="block px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                                      <span className="truncate">
                                        {article.title}
                                      </span>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
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
