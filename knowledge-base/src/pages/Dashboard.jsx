import React, { useState, useEffect } from "react";
import { Article } from "@/entities/Article";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  BookOpen,
  FileText,
  TrendingUp,
  Clock,
  Tag,
  Eye,
  Edit3,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function Dashboard() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const data = await Article.list("-updated_date");
      setArticles(data);
    } finally {
      setIsLoading(false);
    }
  };

  const recentArticles = articles.slice(0, 5);
  const publishedCount = articles.filter(
    (a) => a.status === "published"
  ).length;
  const draftCount = articles.filter((a) => a.status === "draft").length;

  const categoryStats = articles.reduce((stats, article) => {
    const category = article.category || "documentation";
    stats[category] = (stats[category] || 0) + 1;
    return stats;
  }, {});

  const categoryColors = {
    documentation: "bg-blue-100 text-blue-800",
    research: "bg-green-100 text-green-800",
    tutorials: "bg-purple-100 text-purple-800",
    references: "bg-orange-100 text-orange-800",
    projects: "bg-red-100 text-red-800",
    processes: "bg-yellow-100 text-yellow-800",
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
                              {format(
                                new Date(article.updated_date),
                                "MMM d, yyyy"
                              )}
                            </span>
                            <Badge
                              className={`${
                                categoryColors[article.category]
                              } border-0`}
                            >
                              {article.category}
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(categoryStats).map(([category, count]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  >
                    <span className="font-medium text-slate-700 capitalize">
                      {category}
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-slate-200 text-slate-700"
                    >
                      {count}
                    </Badge>
                  </div>
                ))}
                {Object.keys(categoryStats).length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-4 col-span-full">
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
