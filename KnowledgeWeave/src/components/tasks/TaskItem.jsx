import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronDown,
  Edit3,
  Trash2,
  Copy,
  Plus,
  Calendar,
  Tag as TagIcon,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const STATUS_CONFIG = {
  created: { label: "Created", color: "bg-gray-100 text-gray-800" },
  started: { label: "Started", color: "bg-blue-100 text-blue-800" },
  in_progress: { label: "In Progress", color: "bg-indigo-100 text-indigo-800" },
  paused: { label: "Paused", color: "bg-yellow-100 text-yellow-800" },
  done: { label: "Done", color: "bg-green-100 text-green-800" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-800" },
  archived: { label: "Archived", color: "bg-slate-100 text-slate-800" },
  failed: { label: "Failed", color: "bg-red-100 text-red-800" },
  canceled: { label: "Canceled", color: "bg-orange-100 text-orange-800" },
  obsolete: { label: "Obsolete", color: "bg-gray-200 text-gray-800" },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-blue-100 text-blue-700" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "High", color: "bg-red-100 text-red-700" },
};

const COLOR_CONFIG = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  gray: "bg-gray-500",
};

export default function TaskItem({
  task,
  allTasks,
  onEdit,
  onDelete,
  onStatusChange,
  isExpanded,
  onToggleExpand,
  onDuplicate,
  onAddSubtask,
  condensedView,
}) {
  const hasChildren = task.children && task.children.length > 0;
  const isCompleted = task.status === "completed" || task.status === "done";

  // Calculate completion progress - MODIFIED for archived status
  const calculateProgress = (taskId) => {
    // If the task itself is archived, show 100% progress for it
    if (task.status === "archived") return 100;

    const getAllDescendants = (id) => {
      const children = allTasks.filter((t) => t.parent_id === id);
      return [
        ...children,
        ...children.flatMap((child) => getAllDescendants(child.id)),
      ];
    };

    const descendants = getAllDescendants(taskId);
    if (descendants.length === 0) {
      // If no children, progress is based on own completion
      return isCompleted ? 100 : 0;
    }

    // Filter out archived descendants if we are calculating progress for an active parent
    const activeDescendants = descendants.filter(
      (d) => d.status !== "archived"
    );
    const completedActive = activeDescendants.filter(
      (t) => t.status === "done" || t.status === "completed"
    ).length;

    // The current task itself also counts towards its own progress
    const selfCompletion =
      task.status === "done" || task.status === "completed" ? 1 : 0;
    const totalCount = activeDescendants.length + 1; // +1 for the parent itself if it's not archived
    const completedCount = completedActive + selfCompletion;

    if (totalCount === 0) return 0; // Avoid division by zero if no active tasks
    return Math.round((completedCount / totalCount) * 100);
  };

  const progress = calculateProgress(task.id);
  const statusConfig = STATUS_CONFIG[task.status];
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const colorClass = COLOR_CONFIG[task.color];

  const handleCheckboxChange = (checked) => {
    if (checked) {
      onStatusChange(task, "completed");
    } else {
      onStatusChange(task, "created");
    }
  };

  // NEW: Determine status-specific date and label
  const getStatusDateInfo = (task) => {
    const status = task.status;
    const statusDates = task.status_dates || {};
    let dateToDisplay = null;
    let dateLabel = "";

    if (statusDates[status]) {
      dateToDisplay = new Date(statusDates[status]);
      dateLabel = status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    } else if (task.created_date) {
      dateToDisplay = new Date(task.created_date);
      dateLabel = "Created";
    }

    return dateToDisplay
      ? `${dateLabel} on ${format(dateToDisplay, "MMM d, yyyy")}`
      : null;
  };

  const statusDateInfo = getStatusDateInfo(task);

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-start gap-2 hover:bg-slate-50 rounded group",
          condensedView ? "py-0.5 pr-1 pl-0.5" : "p-2" // Reduced padding for condensed view
        )}
      >
        {/* Checkbox */}
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleCheckboxChange}
          className={cn("mt-1 flex-shrink-0", condensedView ? "scale-90" : "")}
        />

        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={() => onToggleExpand(task.id)}
            className={cn(
              "mt-1 p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0",
              condensedView ? "h-6 w-6" : ""
            )}
          >
            {isExpanded ? (
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-slate-600",
                  condensedView ? "w-3.5 h-3.5" : ""
                )}
              />
            ) : (
              <ChevronRight
                className={cn(
                  "w-4 h-4 text-slate-600",
                  condensedView ? "w-3.5 h-3.5" : ""
                )}
              />
            )}
          </button>
        ) : (
          <div
            className={cn("w-6 flex-shrink-0", condensedView ? "w-4" : "")}
          ></div> // Smaller empty space
        )}

        {/* Color Indicator */}
        <div
          className={cn(
            `w-1 ${colorClass} rounded-full flex-shrink-0 mt-1`,
            condensedView ? "h-5" : "h-6"
          )}
        ></div>

        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "flex items-center justify-between gap-2", // Use items-center for better vertical alignment
              condensedView ? "flex-row" : "flex-row items-start" // Keep flex-row, but adjust alignment
            )}
          >
            <div
              className={cn(
                "flex-1 min-w-0",
                condensedView ? "flex flex-row items-center flex-wrap" : ""
              )}
            >
              <h3
                className={cn(
                  "font-semibold text-slate-900 text-sm",
                  isCompleted && "line-through text-slate-500",
                  condensedView ? "mb-0 leading-tight mr-2" : "mb-1" // Reduced margin and tight leading
                )}
              >
                {task.name}
              </h3>

              <div
                className={cn(
                  "flex flex-wrap items-center gap-x-1.5 text-xs", // Reduced gap-x
                  condensedView ? "mt-0.5" : ""
                )}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        `${statusConfig.color} px-2 py-0.5 rounded text-xs font-medium hover:opacity-80 transition-opacity`,
                        condensedView ? "px-1.5 py-0.5 text-[0.6rem]" : ""
                      )} // Smaller padding/font
                    >
                      {statusConfig.label}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => onStatusChange(task, key)}
                      >
                        <span
                          className={`${config.color} px-2 py-1 rounded text-xs font-medium w-full text-center`}
                        >
                          {config.label}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Badge
                  className={cn(
                    `${priorityConfig.color} border-0 text-xs px-1.5 py-0`,
                    condensedView ? "text-[0.6rem] px-1" : ""
                  )}
                >
                  {priorityConfig.label}
                </Badge>

                {task.deadline && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "flex items-center gap-1 text-xs px-1.5 py-0",
                      condensedView ? "text-[0.6rem] px-1" : ""
                    )}
                  >
                    <Calendar
                      className={cn(
                        "w-3 h-3",
                        condensedView ? "w-2.5 h-2.5" : ""
                      )}
                    />
                    {format(new Date(task.deadline), "MMM d, HH:mm")}
                  </Badge>
                )}

                {/* NEW: Display status-specific date */}
                {statusDateInfo && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "flex items-center gap-1 text-xs px-1.5 py-0",
                      condensedView ? "text-[0.6rem] px-1" : ""
                    )}
                  >
                    <Clock
                      className={cn(
                        "w-3 h-3",
                        condensedView ? "w-2.5 h-2.5" : ""
                      )}
                    />
                    {statusDateInfo}
                  </Badge>
                )}

                {task.tags && task.tags.length > 0 && (
                  <div
                    className={cn(
                      "flex items-center gap-1",
                      condensedView ? "" : ""
                    )}
                  >
                    <TagIcon
                      className={cn(
                        "w-3 h-3 text-slate-400",
                        condensedView ? "w-2.5 h-2.5" : ""
                      )}
                    />
                    {task.tags.slice(0, 2).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className={cn(
                          "text-xs px-1.5 py-0",
                          condensedView ? "text-[0.6rem] px-1" : ""
                        )}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {task.tags.length > 2 && (
                      <span
                        className={cn(
                          "text-xs text-slate-500",
                          condensedView ? "text-[0.6rem]" : ""
                        )}
                      >
                        +{task.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {/* Progress bar and text - show here when condensed */}
                {condensedView && progress !== null && (
                  <div className="flex items-center gap-1">
                    <Progress value={progress} className="h-1 w-10" />{" "}
                    {/* Even smaller progress bar */}
                    <span
                      className={cn(
                        `text-xs`,
                        condensedView ? "text-[0.6rem]" : "",
                        isCompleted || task.status === "archived"
                          ? "text-green-600 font-medium"
                          : "text-slate-500"
                      )}
                    >
                      {progress}%
                    </span>
                  </div>
                )}
              </div>

              {/* Progress bar and text - show here when NOT condensed */}
              {!condensedView && progress !== null && (
                <div className="mt-2">
                  <Progress value={progress} className="h-1.5" />
                  <span
                    className={`text-xs ${
                      isCompleted || task.status === "archived"
                        ? "text-green-600 font-medium"
                        : "text-slate-500"
                    }`}
                  >
                    {progress}% complete
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons - Moved to be inline and to the right when condensed */}
            <div
              className={cn(
                "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0",
                condensedView ? "ml-auto" : "" // Push to the right when condensed
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onAddSubtask(task)}
                className={cn(
                  "h-7 w-7 text-green-600 hover:text-green-800 hover:bg-green-50",
                  condensedView ? "h-6 w-6" : ""
                )}
                title="Add subtask"
              >
                <Plus
                  className={cn("w-3.5 h-3.5", condensedView ? "w-3 h-3" : "")}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDuplicate(task)}
                className={cn(
                  "h-7 w-7 text-blue-600 hover:text-blue-800 hover:bg-blue-50",
                  condensedView ? "h-6 w-6" : ""
                )}
                title="Duplicate task"
              >
                <Copy
                  className={cn("w-3.5 h-3.5", condensedView ? "w-3 h-3" : "")}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(task)}
                className={cn(
                  "h-7 w-7 text-slate-600 hover:text-slate-800 hover:bg-slate-100",
                  condensedView ? "h-6 w-6" : ""
                )}
                title="Edit task"
              >
                <Edit3
                  className={cn("w-3.5 h-3.5", condensedView ? "w-3 h-3" : "")}
                />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7 text-red-600 hover:text-red-800 hover:bg-red-50",
                      condensedView ? "h-6 w-6" : ""
                    )}
                    title="Delete task"
                  >
                    <Trash2
                      className={cn(
                        "w-3.5 h-3.5",
                        condensedView ? "w-3 h-3" : ""
                      )}
                    />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete this task and all its subtasks. This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(task.id)}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Task description - hide if condensed, or show truncated if short */}
          {!condensedView && task.description && (
            <p
              className={`text-xs text-slate-600 mt-1 line-clamp-2 ${
                isCompleted ? "text-slate-400" : ""
              }`}
            >
              {task.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
