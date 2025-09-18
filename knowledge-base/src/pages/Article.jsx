import React, { useState, useEffect } from "react";
import { Article } from "@/entities/Article";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Edit3,
  Calendar,
  Tag,
  User,
  Download,
  FileText,
  Image as ImageIcon,
  Trash2,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

export default function ArticlePage() {
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get("id");

  useEffect(() => {
    const loadArticle = async (id) => {
      try {
        const articles = await Article.list();
        const foundArticle = articles.find((a) => a.id === id);
        if (foundArticle) {
          setArticle(foundArticle);
        } else {
          navigate(createPageUrl("Dashboard"));
        }
      } catch (error) {
        console.error("Error loading article:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (articleId) {
      loadArticle(articleId);
    }
  }, [articleId, navigate]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await Article.delete(article.id);
      navigate(createPageUrl("Dashboard"));
    } catch (e) {
      console.error("Error deleting article:", e);
      setIsDeleting(false);
    }
  };

  const categoryColors = {
    documentation: "bg-blue-100 text-blue-800 border-blue-200",
    research: "bg-green-100 text-green-800 border-green-200",
    tutorials: "bg-purple-100 text-purple-800 border-purple-200",
    references: "bg-orange-100 text-orange-800 border-orange-200",
    projects: "bg-red-100 text-red-800 border-red-200",
    processes: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  const priorityColors = {
    low: "bg-slate-100 text-slate-600",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-12 bg-slate-200 rounded w-2/3"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              <div className="h-4 bg-slate-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Article Not Found
          </h2>
          <p className="text-slate-600 mb-4">
            The article you're looking for doesn't exist.
          </p>
          <Link to={createPageUrl("Dashboard")}>
            <Button className="bg-slate-800 hover:bg-slate-900">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <div className="flex items-center justify-between mb-8 gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="border-slate-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl(`Editor?edit=${article.id}`)}>
              <Button>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Article
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    this article.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Yes, delete it"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <article className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-8 border-b border-slate-100">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={`${categoryColors[article.category]} border`}>
                {article.category}
              </Badge>
              <Badge
                variant={
                  article.status === "published" ? "default" : "secondary"
                }
                className="capitalize"
              >
                {article.status}
              </Badge>
              <Badge className={`${priorityColors[article.priority]} border-0`}>
                {article.priority} priority
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              {article.title}
            </h1>

            {article.summary && (
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                {article.summary}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  Created{" "}
                  {format(new Date(article.created_date), "MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{article.author || article.created_by}</span>
              </div>
              {article.updated_date !== article.created_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Updated{" "}
                    {format(new Date(article.updated_date), "MMMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            <div
              className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="p-8 pt-0">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-slate-50 text-slate-600 border-slate-300"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {article.attachments && article.attachments.length > 0 && (
            <div className="p-8 pt-0">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Attachments
              </h3>
              <div className="grid gap-3">
                {article.attachments.map((attachment, index) => (
                  <Card key={index} className="border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {attachment.type?.startsWith("image/") ? (
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <ImageIcon className="w-5 h-5 text-blue-600" />
                          </div>
                        ) : (
                          <div className="p-2 bg-slate-100 rounded-lg">
                            <FileText className="w-5 h-5 text-slate-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">
                            {attachment.filename}
                          </p>
                          <p className="text-sm text-slate-500">
                            {attachment.type}
                          </p>
                        </div>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {article.folder_structure &&
            Object.keys(article.folder_structure).length > 0 && (
              <div className="p-8 pt-0">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Folder className="w-5 h-5" />
                  Project Structure
                </h3>
                <div className="bg-slate-50 rounded-lg p-4 border">
                  <FolderStructureDisplay
                    structure={article.folder_structure}
                  />
                </div>
              </div>
            )}
        </article>
      </div>
    </div>
  );
}

// Add this component at the end of the file
function FolderStructureDisplay({ structure }) {
  const [expandedFolders, setExpandedFolders] = useState(new Set(["root"])); // 'root' for initial expansion

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderStructure = (struct, path = []) => {
    const items = [];

    // Render folders first
    Object.entries(struct).forEach(([key, value]) => {
      // Ensure it's not a special key like _files and it's a folder
      if (key !== "_files" && value.type === "folder") {
        const currentPath = [...path, key];
        const pathString = currentPath.join("/");
        const isExpanded = expandedFolders.has(pathString);

        items.push(
          <div key={`folder-${pathString}`}>
            <button
              onClick={() => toggleFolder(pathString)}
              className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded text-left w-full"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
              <span className="text-sm font-medium text-slate-700 truncate">
                {key}
              </span>
            </button>
            {isExpanded && value.children && (
              <div className="ml-6 border-l border-slate-200 pl-2">
                {renderStructure(value.children, currentPath)}
              </div>
            )}
          </div>
        );
      }
    });

    // Render files
    if (struct._files && struct._files.length > 0) {
      struct._files.forEach((file) => {
        items.push(
          <div
            key={`file-${file.id}`}
            className="flex items-center gap-2 p-1 ml-4"
          >
            <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="text-sm text-slate-600 truncate">{file.name}</span>
          </div>
        );
      });
    }

    return items;
  };

  return (
    <div className="space-y-1">
      {renderStructure(structure, ["root"])}{" "}
      {/* Pass 'root' as the initial path for the top-level structure */}
    </div>
  );
}
