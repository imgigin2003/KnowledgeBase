import { useState, useEffect } from "react";
import { Article } from "@/entities/Article";
import { Categories } from "@/entities/Categories";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  BookOpen,
  FileText,
  Clock,
  Tag,
  Eye,
  Edit3,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function Dashboard() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState({});
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  const loadData = async () => {
    try {
      // Load articles
      const articlesList = await Article.list();
      setArticles(articlesList || []);

      // Load categories from backend
      let categoriesList = await Categories.list();
      if (!categoriesList || categoriesList.length === 0) {
        // Fallback: Derive categories from articles
        categoriesList = buildCategoryTreeFromArticles(articlesList);
      }
      setCategories(categoriesList || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setArticles([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Refresh when article is published
    const handleArticlePublished = () => {
      loadData();
    };

    // Refresh when article is deleted
    const handleArticleDeleted = () => {
      loadData();
    };

    // Refresh when categories are changed or deleted
    const handleCategoryUpdate = () => {
      loadData();
    };

    window.addEventListener("articlePublished", handleArticlePublished);
    window.addEventListener("articleDeleted", handleArticleDeleted);
    window.addEventListener("categoryUpdated", handleCategoryUpdate);
    window.addEventListener("categoryDeleted", handleCategoryUpdate);

    return () => {
      window.removeEventListener("articlePublished", handleArticlePublished);
      window.removeEventListener("articleDeleted", handleArticleDeleted);
      window.removeEventListener("categoryUpdated", handleCategoryUpdate);
      window.removeEventListener("categoryDeleted", handleCategoryUpdate);
    };
  }, []);

  const buildCategoryTreeFromArticles = (articlesList) => {
    const categoryMap = new Map();
    articlesList.forEach((article) => {
      const cats =
        article.categories ||
        (article.category ? [article.category] : ["uncategorized"]);
      cats.forEach((cat) => {
        const parts = cat.split("/").filter(Boolean);
        let currentLevel = categoryMap;
        let currentPath = "";
        parts.forEach((part, index) => {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          if (!currentLevel.has(part)) {
            currentLevel.set(part, {
              id: `${article.id}-${index + 1}`,
              name: part,
              subcategories: new Map(),
              createdAt: article.createdAt,
            });
          }
          currentLevel = currentLevel.get(part).subcategories;
        });
      });
    });

    const convertMapToArray = (map) => {
      return Array.from(map.values()).map((cat) => ({
        ...cat,
        subcategories: convertMapToArray(cat.subcategories),
      }));
    };

    return convertMapToArray(categoryMap);
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const newCat = {
        name: newCategory.trim(),
        subcategories: [],
      };
      const savedCategory = await Categories.create(newCat);
      setCategories((prev) => [...prev, savedCategory]);
      setNewCategory("");
      window.dispatchEvent(new Event("categoryUpdated"));
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const addSubcategory = async (parentId) => {
    const subcategoryName = newSubcategory[parentId]?.trim();
    if (!subcategoryName) return;

    try {
      const newCats = structuredClone(categories);
      let parentCategory;
      const findParent = (nodes) => {
        for (const node of nodes) {
          if (node.id === parentId) {
            parentCategory = node;
            return true;
          }
          if (node.subcategories && findParent(node.subcategories)) return true;
        }
        return false;
      };
      findParent(newCats);

      if (parentCategory) {
        parentCategory.subcategories.push({
          id: Date.now().toString(),
          name: subcategoryName,
          subcategories: [],
          createdAt: new Date().toISOString(),
        });
        await Categories.update(parentCategory.id, parentCategory);
        setCategories(newCats);
        setNewSubcategory((prev) => ({ ...prev, [parentId]: "" }));
      }
      window.dispatchEvent(new Event("categoryUpdated"));
    } catch (error) {
      console.error("Error adding subcategory:", error);
    }
  };

  const removeCategory = async (id) => {
    try {
      await Categories.delete(id);
      setCategories((prev) => {
        const newCats = structuredClone(prev);
        const removeNode = (nodes) => {
          const idx = nodes.findIndex((node) => node.id === id);
          if (idx !== -1) {
            nodes.splice(idx, 1);
            return true;
          }
          return nodes.some((node) => removeNode(node.subcategories));
        };
        removeNode(newCats);
        return newCats;
      });
      window.dispatchEvent(new Event("categoryDeleted"));
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const renameCategory = async (id, newName) => {
    if (!newName.trim()) return;

    try {
      const newCats = structuredClone(categories);
      let targetCategory = null;
      let parentPath = [];

      const findCategory = (nodes, path = []) => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.id === id) {
            targetCategory = node;
            parentPath = [...path, i];
            return true;
          }
          if (node.subcategories && node.subcategories.length > 0) {
            const found = findCategory(node.subcategories, [
              ...path,
              i,
              "subcategories",
            ]);
            if (found) return true;
          }
        }
        return false;
      };

      const found = findCategory(newCats);
      if (!found || !targetCategory) {
        throw new Error(`Category with ID ${id} not found`);
      }

      targetCategory.name = newName.trim();

      const topLevelCategoryId = newCats[parentPath[0]].id;
      await Categories.update(topLevelCategoryId, newCats[parentPath[0]]);

      setCategories(newCats);
      setEditingCategory(null);
      setEditCategoryName("");

      window.dispatchEvent(new Event("categoryUpdated"));
    } catch (error) {
      console.error("Error renaming category:", error.message, error.stack);
    }
  };

  const toggleCategory = (id) => {
    setExpandedCategories((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  };

  const startEditingCategory = (id, currentName) => {
    setEditingCategory(id);
    setEditCategoryName(currentName);
  };

  const recentArticles = articles.slice(0, 5);
  const publishedCount = articles.filter(
    (a) => a.status === "published"
  ).length;
  const draftCount = articles.filter((a) => a.status === "draft").length;

  const categoryStats = articles.reduce((stats, article) => {
    const cats =
      article.categories ||
      (article.category ? [article.category] : ["uncategorized"]);
    cats.forEach((cat) => {
      const topLevel = cat.split("/")[0];
      stats[topLevel] = (stats[topLevel] || 0) + 1;
    });
    return stats;
  }, {});

  const categoryColors = {
    documentation: "bg-blue-100 text-blue-800",
    research: "bg-green-100 text-green-800",
    tutorials: "bg-purple-100 text-purple-800",
    references: "bg-orange-100 text-orange-800",
    projects: "bg-red-100 text-red-800",
    processes: "bg-yellow-100 text-yellow-800",
    uncategorized: "bg-gray-100 text-gray-800",
    Technology: "bg-teal-100 text-teal-800",
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderCategoryTree = (nodes, level = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className={`ml-${level * 4} mt-2`}>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleCategory(node.id)}
            className="p-1"
          >
            {expandedCategories.has(node.id) ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>

          {editingCategory === node.id ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                placeholder="New category name"
                className="border-slate-300"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => renameCategory(node.id, editCategoryName)}
                disabled={!editCategoryName.trim()}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingCategory(null)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <span className="font-medium text-slate-700 capitalize flex-1">
                {node.name}
              </span>
              <Badge
                variant="secondary"
                className="bg-slate-200 text-slate-700"
              >
                {categoryStats[node.name] || 0}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEditingCategory(node.id, node.name)}
                className="text-blue-600"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCategory(node.id)}
                className="text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
        {expandedCategories.has(node.id) && (
          <div className="ml-4 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <Input
                value={newSubcategory[node.id] || ""}
                onChange={(e) =>
                  setNewSubcategory((prev) => ({
                    ...prev,
                    [node.id]: e.target.value,
                  }))
                }
                placeholder="Add subcategory..."
                className="border-slate-300"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => addSubcategory(node.id)}
                disabled={!newSubcategory[node.id]?.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {node.subcategories.length > 0 &&
              renderCategoryTree(node.subcategories, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Knowledge Dashboard
            </h1>
            <p className="text-slate-600 mt-2">
              Manage your internal documentation and knowledge base
            </p>
          </div>
          <Link to={createPageUrl("Editor")}>
            <Button className="bg-slate-800 hover:bg-slate-900 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Article
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Total Articles
                  </p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">
                    {articles.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Published
                  </p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {publishedCount}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Drafts</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">
                    {draftCount}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Edit3 className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Articles and Categories */}
        <div className="space-y-8">
          <Card className="border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-600" />
                Recent Articles
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentArticles.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentArticles.map((article) => (
                    <Link
                      key={article.id}
                      to={createPageUrl(`Article?id=${article.id}`)}
                      className="block p-6 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1">
                            {article.title}
                          </h3>
                          {article.summary && (
                            <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                              {article.summary}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>
                              {article.updatedAt || article.createdAt
                                ? format(
                                    new Date(
                                      article.updatedAt || article.createdAt
                                    ),
                                    "MMM d, yyyy"
                                  )
                                : "No date"}
                            </span>
                            <Badge
                              className={`${
                                categoryColors[
                                  article.categories?.[0]?.split("/")[0] ||
                                    article.category ||
                                    "uncategorized"
                                ]
                              } border-0`}
                            >
                              {article.categories?.[0] ||
                                article.category ||
                                "uncategorized"}
                            </Badge>
                            <Badge
                              variant={
                                article.status === "published"
                                  ? "default"
                                  : "secondary"
                              }
                              className="capitalize"
                            >
                              {article.status}
                            </Badge>
                          </div>
                        </div>
                        <Eye className="w-4 h-4 text-slate-400 ml-4" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    No articles yet
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Start building your knowledge base
                  </p>
                  <Link to={createPageUrl("Editor")}>
                    <Button className="bg-slate-800 hover:bg-slate-900">
                      Create First Article
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-slate-600" />
                Article Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Add new category..."
                    className="border-slate-300"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCategory}
                    disabled={!newCategory.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {categories.length > 0 ? (
                  renderCategoryTree(categories)
                ) : (
                  <p className="text-slate-500 text-sm text-center py-4">
                    No categories yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
