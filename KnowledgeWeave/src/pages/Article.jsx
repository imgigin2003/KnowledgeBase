import { useState, useEffect } from "react";
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
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get("id");

  useEffect(() => {
    const loadArticle = async (id) => {
      try {
        const foundArticle = await Article.get(id); // بهینه‌سازی: مستقیم get
        if (foundArticle) {
          setArticle(foundArticle);
        } else {
          navigate(createPageUrl("Dashboard"));
        }
      } catch (error) {
        console.error("Error loading article:", error);
        navigate(createPageUrl("Dashboard"));
      } finally {
        setIsLoading(false);
      }
    };

    if (articleId) {
      loadArticle(articleId);
    }
  }, [articleId, navigate]);

  const safeFormatDate = (dateString, formatStr) => {
    if (!dateString) return "Unknown Date"; // fallback اگر null
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date"; // چک valid
      return format(date, formatStr);
    } catch (error) {
      console.error("Date format error:", error, dateString); // log
      return "Invalid Date";
    }
  };

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

  const toggleFolder = (path) => {
    setExpandedFolders((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return newExpanded;
    });
  };

  const structure = article?.folder_structure || {};

  const categoryColors = {
    documentation: "bg-blue-100 text-blue-800 border-blue-200",
    research: "bg-green-100 text-green-800 border-green-200",
    tutorials: "bg-purple-100 text-purple-800 border-purple-200",
    references: "bg-orange-100 text-orange-800 border-orange-200",
    projects: "bg-red-100 text-red-800 border-red-200",
    processes: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!article) {
    return <div className="p-8">Article not found</div>;
  }

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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Dashboard"))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-2">
          <Link to={createPageUrl(`Editor?edit=${article.id}`)}>
            <Button variant="outline">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Article?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete "
                  {article.title}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Title and Metadata */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">{article.title}</h1>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{article.author || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{safeFormatDate(article.createdAt, "MMM dd, yyyy")}</span>
          </div>
          <Badge
            className={
              categoryColors[article.category] || "bg-gray-100 text-gray-800"
            }
          >
            {article.category}
          </Badge>
          {article.tags &&
            article.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-slate-100 text-slate-700"
              >
                {tag}
              </Badge>
            ))}
          <Badge
            variant={article.status === "published" ? "default" : "secondary"}
          >
            {article.status}
          </Badge>
        </div>
        {article.summary && (
          <p className="text-slate-600 italic">{article.summary}</p>
        )}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          <div className="prose max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: article.content
                  ? `<p>${article.content.replace(/\n/g, "</p><p>")}</p>`
                  : "",
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      {article.attachments && article.attachments.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Attachments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {article.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <ImageIcon className="w-8 h-8 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{attachment.name}</p>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Folder Structure */}
      {structure && Object.keys(structure).length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Folder Structure
            </h3>
            <div className="space-y-1">
              {renderStructure(structure, ["root"])}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
