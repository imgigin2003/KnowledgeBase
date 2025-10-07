// src/pages/Editor.jsx
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
  const [article, setArticles] = useState({
    title: "",
    content: "",
    summary: "",
    author: "",
    status: "draft",
    priority: "medium",
    tags: [],
    attachments: [],
    folder_structure: {},
    created_by: "",
    categories: [], // New: array of path strings
  });
  const [newTag, setNewTag] = useState("");
  const [categories, setCategories] = useState([
    { id: crypto.randomUUID(), name: "", subcategories: [] },
  ]);

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("edit");

  const buildTreeFromPaths = (paths) => {
    const root = [];

    paths.forEach((path) => {
      const parts = path.split("/").filter(Boolean);
      let currentLevel = root;

      parts.forEach((part) => {
        let existingNode = currentLevel.find((node) => node.name === part);
        if (!existingNode) {
          existingNode = {
            id: crypto.randomUUID(),
            name: part,
            subcategories: [],
          };
          currentLevel.push(existingNode);
        }
        currentLevel = existingNode.subcategories;
      });
    });

    return root;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load current user
        const me = await user.me();
        setCurrentuser(me);
        setArticles((prev) => ({
          ...prev,
          author: me?.full_name || me?.email || "",
          created_by: me?.id || "",
        }));

        // Load all articles just for existing tags
        const all = await Article.list();
        setAllArticles(all);
        const tags = [...new Set(all.flatMap((a) => a.tags || []))];
        setExistingTags(tags);

        // If editing, fetch just that article
        if (editId) {
          const foundArticle = await Article.get(editId);
          if (foundArticle) {
            setArticles(foundArticle);
            const categoryPaths =
              foundArticle.categories && foundArticle.categories.length > 0
                ? foundArticle.categories
                : foundArticle.category
                ? [foundArticle.category]
                : [];

            setCategories(buildTreeFromPaths(categoryPaths));
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setCurrentuser(null);
      }
    };

    loadData();
  }, [editId, navigate]);

  const addTag = (tagToAdd = newTag.trim()) => {
    if (tagToAdd && !article.tags.includes(tagToAdd)) {
      setArticles((prev) => ({
        ...prev,
        tags: [...prev.tags, tagToAdd],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setArticles((prev) => ({
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
      setArticles((prev) => ({
        ...prev,
        attachments: [...prev.attachments, attachment],
      }));
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const flattenCategories = (nodes, parentPath = "") => {
    let result = [];
    nodes.forEach((node) => {
      const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
      result.push(currentPath);
      if (node.subcategories?.length > 0) {
        result = result.concat(
          flattenCategories(node.subcategories, currentPath)
        );
      }
    });
    return result;
  };

  const handleSave = async (status = article.status) => {
    if (!article.title.trim()) return;

    setIsLoading(true);
    try {
      const saveData = {
        ...article,
        status,
        categories: flattenCategories(categories),
      };

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
    setArticles((prev) => ({ ...prev, folder_structure: newStructure }));
  };

  if (isLoading && !editId) {
    return <div className="p-8">Loading...</div>;
  }

  const isPublished = article.status === "published";

  const renderCategoryTree = (nodes, parentIndex = null) => {
    return nodes.map((node, index) => (
      <div key={node.id} className="ml-4 mt-2">
        <div className="flex items-center gap-2">
          <Input
            value={node.name}
            onChange={(e) => {
              const newCats = structuredClone(categories);
              const updateNode = (list) => {
                list.forEach((item) => {
                  if (item.id === node.id) item.name = e.target.value;
                  else if (item.subcategories) updateNode(item.subcategories);
                });
              };
              updateNode(newCats);
              setCategories(newCats);
            }}
            placeholder="Category name"
            className="border-slate-300"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newCats = structuredClone(categories);
              const removeNode = (list) => {
                const idx = list.findIndex((item) => item.id === node.id);
                if (idx !== -1) list.splice(idx, 1);
                else list.forEach((item) => removeNode(item.subcategories));
              };
              removeNode(newCats);
              setCategories(newCats);
            }}
          >
            -
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newCats = structuredClone(categories);
              const addSub = (list) => {
                list.forEach((item) => {
                  if (item.id === node.id) {
                    item.subcategories.push({
                      id: crypto.randomUUID(),
                      name: "",
                      subcategories: [],
                    });
                  } else if (item.subcategories) addSub(item.subcategories);
                });
              };
              addSub(newCats);
              setCategories(newCats);
            }}
          >
            +
          </Button>
        </div>
        {node.subcategories?.length > 0 && (
          <div className="ml-6">
            {renderCategoryTree(node.subcategories, index)}
          </div>
        )}
      </div>
    ));
  };

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
                      setArticles((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
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
                      setArticles((prev) => ({
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
                      setArticles((prev) => ({
                        ...prev,
                        summary: e.target.value,
                      }))
                    }
                    placeholder="Brief summary..."
                    className="mt-1 min-h-[100px] border-slate-300 focus:border-slate-500"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="content"
                    className="text-sm font-medium text-slate-700"
                  >
                    Content
                  </Label>
                  <Textarea
                    id="content"
                    value={article.content}
                    onChange={(e) =>
                      setArticles((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    placeholder="Write your article content (supports Markdown)..."
                    className="mt-1 min-h-[300px] border-slate-300 focus:border-slate-500 font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

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

            <Card>
              <CardContent className="p-6">
                <FolderStructureEditor
                  value={article.folder_structure}
                  onChange={updateFolderStructure}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">
                    Status
                  </Label>
                  <Select
                    value={article.status}
                    onValueChange={(value) =>
                      setArticles((prev) => ({ ...prev, status: value }))
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
                      setArticles((prev) => ({ ...prev, priority: value }))
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
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {renderCategoryTree(categories)}
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCategories([
                        ...categories,
                        {
                          id: crypto.randomUUID(),
                          name: "",
                          subcategories: [],
                        },
                      ])
                    }
                    className="w-full border-slate-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Root Category
                  </Button>
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
