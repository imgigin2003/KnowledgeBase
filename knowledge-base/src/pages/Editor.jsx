import React, { useState, useEffect } from "react";
import { Article } from "@/entities/Article";
import { UploadFile } from "@/integrations/Core";
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
  const [currentUser, setCurrentUser] = useState(null);
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
  });
  const [newTag, setNewTag] = useState("");

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("edit");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load current user
        const user = await User.me();
        setCurrentUser(user);

        // Load all articles to get existing tags
        const articles = await Article.list();
        setAllArticles(articles);

        // Extract unique tags from all articles
        const tags = [...new Set(articles.flatMap((a) => a.tags || []))];
        setExistingTags(tags);

        // If editing, load the article
        if (editId) {
          const foundArticle = articles.find((a) => a.id === editId);
          if (foundArticle) {
            setArticle(foundArticle);
          }
        } else {
          // Set default author for new articles
          setArticle((prev) => ({ ...prev, author: user?.full_name || "" }));
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, [editId]);

  const handleSave = async (status = article.status) => {
    if (!article.title.trim()) return;

    setIsLoading(true);
    try {
      const articleData = { ...article, status };

      if (editId) {
        await Article.update(editId, articleData);
      } else {
        await Article.create(articleData);
      }

      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error saving article:", error);
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const attachment = {
        filename: file.name,
        url: file_url,
        type: file.type,
      };

      setArticle((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), attachment],
      }));
    } catch (error) {
      console.error("Error uploading file:", error);
    }
    setIsUploading(false);
  };

  const handleFolderStructureChange = (folderStructure) => {
    setArticle((prev) => ({
      ...prev,
      folder_structure: folderStructure,
    }));
  };

  const removeAttachment = (index) => {
    setArticle((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const addTag = (tagToAdd = newTag.trim()) => {
    if (tagToAdd && !article.tags.includes(tagToAdd)) {
      setArticle((prev) => ({
        ...prev,
        tags: [...prev.tags, tagToAdd],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setArticle((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const isPublished = article.status === "published";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="border-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">
              {editId ? "Edit Article" : "Create New Article"}
            </h1>
            <p className="text-slate-600">
              Add knowledge to your internal documentation
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleSave("draft")}
              disabled={isLoading || !article.title.trim()}
              className="border-slate-300"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave("published")}
              disabled={isLoading || !article.title.trim()}
              className="bg-slate-800 hover:bg-slate-900"
            >
              <Eye className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label
                    htmlFor="title"
                    className="text-sm font-medium text-slate-700"
                  >
                    Article Title
                  </Label>
                  <Input
                    id="title"
                    value={article.title}
                    onChange={(e) =>
                      setArticle((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Enter article title..."
                    className="mt-1 text-lg font-semibold border-slate-300 focus:border-slate-500"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="author"
                    className="text-sm font-medium text-slate-700"
                  >
                    Author
                  </Label>
                  <Input
                    id="author"
                    value={article.author}
                    onChange={(e) =>
                      setArticle((prev) => ({
                        ...prev,
                        author: e.target.value,
                      }))
                    }
                    placeholder="Author name..."
                    className={`mt-1 border-slate-300 focus:border-slate-500 ${
                      isPublished ? "bg-slate-50 text-slate-500" : ""
                    }`}
                    disabled={isPublished}
                  />
                  {isPublished && (
                    <p className="text-xs text-slate-500 mt-1">
                      Author cannot be changed after publication
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="summary"
                    className="text-sm font-medium text-slate-700"
                  >
                    Summary
                  </Label>
                  <Textarea
                    id="summary"
                    value={article.summary}
                    onChange={(e) =>
                      setArticle((prev) => ({
                        ...prev,
                        summary: e.target.value,
                      }))
                    }
                    placeholder="Brief summary of the article..."
                    className="mt-1 border-slate-300 focus:border-slate-500"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">
                    Content
                  </Label>
                  <Textarea
                    value={article.content}
                    onChange={(e) =>
                      setArticle((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    placeholder="Write your article content here. You can use HTML formatting if needed..."
                    className="mt-1 border-slate-300 focus:border-slate-500 font-mono text-sm"
                    rows={20}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    You can use basic HTML tags for formatting (h1, h2, h3, p,
                    ul, ol, li, strong, em, etc.)
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    File Attachments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      multiple
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        document.getElementById("file-upload").click()
                      }
                      disabled={isUploading}
                      className="border-slate-300"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? "Uploading..." : "Upload Files"}
                    </Button>
                  </div>

                  {article.attachments?.length > 0 && (
                    <div className="space-y-3">
                      {article.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                        >
                          {attachment.type?.startsWith("image/") ? (
                            <ImageIcon className="w-5 h-5 text-slate-500" />
                          ) : (
                            <FileText className="w-5 h-5 text-slate-500" />
                          )}
                          <span className="flex-1 text-sm font-medium text-slate-700">
                            {attachment.filename}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAttachment(index)}
                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <FolderStructureEditor
                value={article.folder_structure}
                onChange={handleFolderStructureChange}
              />
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">
                    Category
                  </Label>
                  <Select
                    value={article.category}
                    onValueChange={(value) =>
                      setArticle((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger className="mt-1 border-slate-300">
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
                  <Label className="text-sm font-medium text-slate-700">
                    Status
                  </Label>
                  <Select
                    value={article.status}
                    onValueChange={(value) =>
                      setArticle((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="mt-1 border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
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

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
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
          </div>
        </div>
      </div>
    </div>
  );
}
