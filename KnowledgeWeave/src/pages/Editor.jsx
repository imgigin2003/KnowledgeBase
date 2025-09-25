import { useState, useEffect } from "react";
import { Article } from "@/entities/Article";
import { user } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Save,
  Eye,
  Upload,
  X,
  Plus,
  FileText,
  Image as ImageIcon,
  ArrowLeft,
  Tag,
} from "lucide-react";

import FolderStructureEditor from "../components/editor/FolderStructureEditor";

const CATEGORIES = [
  { value: "documentation", label: "Documentation" },
  { value: "research", label: "Research" },
  { value: "tutorials", label: "Tutorials" },
  { value: "references", label: "References" },
  { value: "projects", label: "Projects" },
  { value: "processes", label: "Processes" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function Editor() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentuser, setCurrentuser] = useState(null);
  const [allArticles, setAllArticles] = useState([]);
  const [existingTags, setExistingTags] = useState([]);
  const [article, setArticle] = useState({
    title: "",
    content: "",
    summary: "",
    author: "",
    category: "documentation",
    status: "draft",
    priority: "medium",
    tags: [],
    attachments: [],
    folder_structure: {},
    created_by: "",
  });
  const [newTag, setNewTag] = useState("");

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("edit");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load current user
        const user = await user.me();
        setCurrentuser(user);
        setArticle((prev) => ({
          ...prev,
          author: user?.full_name || user?.email || "",
          created_by: user?.id || "",
        }));

        // Load all articles to get existing tags
        const articles = await Article.list();
        setAllArticles(articles);
        const tags = articles.flatMap((a) => a.tags || []).filter(Boolean);
        setExistingTags([...new Set(tags)]);
      } catch (error) {
        console.error("Error loading data:", error);
        setCurrentuser(null);
      }
    };

    loadData();

    // Load existing article for edit
    if (editId) {
      const loadArticles = async () => {
        try {
          const articles = await Article.list();
          setArticles(articles || []);
        } catch (error) {
          console.error("Error loading articles:", error);
        }
      };

      loadArticles();
    }
  }, [editId, navigate]);

  const addTag = (tag = newTag.trim()) => {
    if (tag && !article.tags.includes(tag)) {
      setArticle((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setArticle((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const attachment = await UploadFile(file);
      setArticle((prev) => ({
        ...prev,
        attachments: [...prev.attachments, attachment],
      }));
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (status = article.status) => {
    if (!article.title.trim()) return;

    setIsLoading(true);
    try {
      const saveData = { ...article, status };
      if (editId) {
        await Article.update(editId, saveData);
      } else {
        await Article.create(saveData);
      }
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error saving article:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFolderStructure = (newStructure) => {
    setArticle((prev) => ({ ...prev, folder_structure: newStructure }));
  };

  if (isLoading && !editId) {
    return <div className="p-8">Loading...</div>;
  }

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
        <div className="flex gap-2">
          <Button
            onClick={() => handleSave("draft")}
            disabled={isLoading || !article.title.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            onClick={() => handleSave("published")}
            disabled={isLoading || !article.title.trim()}
          >
            <Eye className="w-4 h-4 mr-2" />
            {isLoading ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Basic Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Article Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={article.title}
                  onChange={(e) =>
                    setArticle((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter article title"
                />
              </div>
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={article.author}
                  onChange={(e) =>
                    setArticle((prev) => ({ ...prev, author: e.target.value }))
                  }
                  placeholder="Enter author name (optional, auto-filled from user)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If left empty, it will default to your profile name.
                </p>
              </div>
              <div>
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={article.summary}
                  onChange={(e) =>
                    setArticle((prev) => ({ ...prev, summary: e.target.value }))
                  }
                  placeholder="Brief summary (optional)"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={article.content}
                  onChange={(e) =>
                    setArticle((prev) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Write your article here..."
                  rows={20}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category, Status, Priority */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={article.category}
                  onValueChange={(value) =>
                    setArticle((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={article.status}
                  onValueChange={(value) =>
                    setArticle((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">
                  Priority
                </Label>
                <Select
                  value={article.priority}
                  onValueChange={(value) =>
                    setArticle((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger className="mt-1 border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tags, Attachments, Folder Structure */}
        <div className="space-y-6">
          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newTag">Add New Tag</Label>
                <div className="flex gap-2">
                  <Input
                    id="newTag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                    className="border-slate-300"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => addTag()}
                    disabled={!newTag.trim()}
                    className="border-slate-300"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {existingTags.length > 0 && (
                <div>
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Existing Tags
                  </Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {existingTags.map((tag, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => addTag(tag)}
                        className="h-6 px-2 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200"
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {article.tags.length > 0 && (
                <div>
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Selected Tags
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {article.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Upload File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="border-slate-300"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("file-upload").click()
                    }
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </div>
              {article.attachments.length > 0 && (
                <div className="space-y-2">
                  {article.attachments.map((att, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-slate-500" />
                        <span className="text-sm">{att.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setArticle((prev) => ({
                            ...prev,
                            attachments: prev.attachments.filter(
                              (_, i) => i !== index
                            ),
                          }))
                        }
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Folder Structure */}
          <Card>
            <CardHeader>
              <CardTitle>Folder Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <FolderStructureEditor
                value={article.folder_structure}
                onChange={updateFolderStructure}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
