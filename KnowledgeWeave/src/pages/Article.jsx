import { useState, useEffect, useRef } from "react";
import { Article } from "@/entities/Article";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommentForm } from "@/components/ui/comment-form";
import { CommentList } from "@/components/ui/comment-list";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
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
  Tag,
  MessageCircle,
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
const safeFormatDate = (dateStr) => {
  if (!dateStr) return "No date";
  const d = new Date(dateStr);
  return isNaN(d) ? "Invalid date" : format(d, "MMMM d, yyyy");
};

export default function ArticlePage() {
  const navigate = useNavigate();
  const [article, setArticles] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [comments, setComments] = useState([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState("");

  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get("id");

  const commentsRef = useRef(null);

  useEffect(() => {
    const loadArticle = async (id) => {
      try {
        const foundArticle = await Article.get(id);
        if (foundArticle) {
          setArticles(foundArticle);
          setComments(foundArticle.comments || []);
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await Article.delete(article.id);
      window.dispatchEvent(new Event("articleDeleted"));
      navigate(createPageUrl("Dashboard"));
    } catch (e) {
      console.error("Error deleting article:", e);
      setIsDeleting(false);
    }
  };

  const handleAddComment = async (commentData) => {
    setIsSubmittingComment(true);
    setCommentError("");
    try {
      const updatedArticle = await Article.addComment(article.id, commentData);
      setComments([
        ...comments,
        updatedArticle.comments[updatedArticle.comments.length - 1],
      ]);
    } catch (error) {
      setCommentError("Failed to Post Comment... Try again.");
    } finally {
      setIsSubmittingComment(false);
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

  const priorityColors = {
    low: "bg-slate-100 text-slate-600",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!article) {
    return <div className="p-8">Article not found</div>;
  }

  const getCategoryColor = (category) => {
    const normalized = category?.toLowerCase();
    if (categoryColors[normalized]) return categoryColors[normalized];

    const keys = Object.keys(categoryColors);
    const hash = Array.from(normalized || "").reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    );
    const randomIndex = hash % keys.length;
    return categoryColors[keys[randomIndex]] || "bg-gray-400";
  };

  const categoryValue =
    article?.category ||
    (Array.isArray(article?.categories)
      ? article.categories[0]
      : article?.categories) ||
    "";

  const parentCategory = categoryValue?.split("/")?.[0] || "";
  console.log("Parent category:", parentCategory);

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
          {article.status === "published" && (
            <Button
              variant="outline"
              onClick={() => {
                commentsRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Leave a Comment!
            </Button>
          )}
          <Link to={createPageUrl(`Editor?edit=${article.id}`)}>
            <Button variant="outline">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isDeleting}
                className="bg-red-100 text-red-800 hover:bg-red-200"
              >
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
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Title and Metadata */}
      <article className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="space-y-4">
          <div className="p-8 border-b border-slate-100">
            <div className="flex flex-wrap gap-2 mb-4">
              {parentCategory && (
                <Badge className={`${getCategoryColor(parentCategory)}`}>
                  {parentCategory}
                </Badge>
              )}

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
                <span>Created: {safeFormatDate(article.createdAt)}</span>
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{article.author || "Unknown"}</span>
              </div>

              {article.updatedAt && article.updatedAt !== article.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Updated: {safeFormatDate(article.updatedAt)}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <Card>
              <CardContent className="p-6 prose prose-slate max-w-none">
                <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>
                  {article.content || ""}
                </ReactMarkdown>
              </CardContent>
            </Card>

            <br></br>
            {article.tags && article.tags.length > 0 && (
              <div className="p-8 pt-0">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">
                    Tags
                  </span>
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
          </div>
        </div>
      </article>

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

      {/* Only display when article is published */}
      {article.status === "published" && (
        <Card ref={commentsRef}>
          {" "}
          {/* ref رو اینجا اضافه کن */}
          <CardContent className="p-6 space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
              <User className="w-5 h-5" /> Comments ({comments.length})
            </h3>
            <CommentList comments={comments} />
            <CommentForm
              onSubmit={handleAddComment}
              isSubmitting={isSubmittingComment}
              error={commentError}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
