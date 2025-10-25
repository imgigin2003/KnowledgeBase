import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";

const PRIORITIES = ["all", "low", "medium", "high"];
const STATUSES = [
  "all",
  "created",
  "started",
  "in_progress",
  "paused",
  "done",
  "completed",
  "archived",
];
const COLORS = [
  "all",
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "gray",
];

const COLOR_CLASSES = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  gray: "bg-gray-500",
};

export default function TaskFilters({
  filters,
  onFiltersChange,
  availableTags,
}) {
  const hasActiveFilters =
    filters.priority !== "all" ||
    filters.status !== "all" ||
    filters.color !== "all" ||
    filters.tags.length > 0;

  const clearFilters = () => {
    onFiltersChange({
      priority: "all",
      status: "all",
      color: "all",
      tags: [],
    });
  };

  const toggleTag = (tag) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">Filters</span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Select
            value={filters.priority}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, priority: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority === "all"
                    ? "All Priorities"
                    : priority.charAt(0).toUpperCase() + priority.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "all"
                    ? "All Statuses"
                    : status
                        .split("_")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select
            value={filters.color}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, color: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colors</SelectItem>
              {COLORS.filter((c) => c !== "all").map((color) => (
                <SelectItem key={color} value={color}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full ${COLOR_CLASSES[color]}`}
                    ></div>
                    {color.charAt(0).toUpperCase() + color.slice(1)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {availableTags.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">
            Filter by tags:
          </p>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag, index) => (
              <Badge
                key={index}
                variant={filters.tags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer hover:bg-slate-200"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
