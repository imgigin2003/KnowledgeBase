import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";

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
  all: "bg-slate-100 text-slate-700",
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
    filters.tags.length > 0 ||
    filters.dateRange?.startDate ||
    filters.dateRange?.endDate;

  const handleClearFilters = () => {
    onFiltersChange({
      priority: "all",
      status: "all",
      color: "all",
      tags: [],
      dateRange: { startDate: null, endDate: null },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg border bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Priority
          </label>
          <Select
            value={filters.priority}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, priority: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Color Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Color
          </label>
          <Select
            value={filters.color}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, color: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by color" />
            </SelectTrigger>
            <SelectContent>
              {COLORS.map((color) => (
                <SelectItem key={color} value={color}>
                  <div className="flex items-center gap-2">
                    {color !== "all" && (
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full",
                          COLOR_CLASSES[color]
                        )}
                      ></div>
                    )}
                    {color.charAt(0).toUpperCase() + color.slice(1)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter (Created At) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Created Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.dateRange?.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange?.startDate ? (
                  filters.dateRange.endDate ? (
                    <>
                      {format(filters.dateRange.startDate, "LLL dd, y")} -{" "}
                      {format(filters.dateRange.endDate, "LLL dd, y")}
                    </>
                  ) : (
                    format(filters.dateRange.startDate, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={filters.dateRange}
                onSelect={(range) =>
                  onFiltersChange({ ...filters, dateRange: range })
                }
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Tags Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <Badge
              key={tag}
              variant={filters.tags.includes(tag) ? "default" : "secondary"}
              className={cn(
                "cursor-pointer hover:opacity-80 transition-opacity",
                filters.tags.includes(tag)
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700"
              )}
              onClick={() => {
                const newTags = filters.tags.includes(tag)
                  ? filters.tags.filter((t) => t !== tag)
                  : [...filters.tags, tag];
                onFiltersChange({ ...filters, tags: newTags });
              }}
            >
              {tag}
              {filters.tags.includes(tag) && <X className="ml-1 h-3 w-3" />}
            </Badge>
          ))}
        </div>
        {availableTags.length === 0 && (
          <p className="text-sm text-slate-500">No tags available.</p>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" onClick={handleClearFilters}>
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
