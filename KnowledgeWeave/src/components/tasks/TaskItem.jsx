import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronDown,
  Edit3,
  Trash2,
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
  onAddSubtask,
  isExpanded,
  onToggleExpand,
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

  const progress = calculateProgress(task.id); // Always calculate, then use for display
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

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-start gap-2 hover:bg-slate-50 rounded group",
          condensedView ? "p-0.5" : "p-2"
        )}
      >
        {hasChildren ? (
          <button
            onClick={() => onToggleExpand(task.id)}
            className="mt-1 p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-600" />
            )}
          </button>
        ) : (
          <div className="w-6 flex-shrink-0"></div>
        )}

        <div
          className={`w-1 h-6 ${colorClass} rounded-full flex-shrink-0 mt-1`}
        ></div>

        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "flex items-start justify-between gap-2",
              condensedView ? "flex-col items-stretch" : "flex-row"
            )}
          >
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "font-semibold text-slate-900 text-sm",
                  isCompleted && "line-through text-slate-500",
                  condensedView ? "mb-0 leading-tight" : "mb-1"
                )}
              >
                {task.name}
              </h3>

              <div
                className={cn(
                  "flex flex-wrap items-center gap-x-2 text-xs",
                  condensedView ? "mt-0.5" : ""
                )}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`${statusConfig.color} px-2 py-0.5 rounded text-xs font-medium hover:opacity-80 transition-opacity`}
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
                  className={`${priorityConfig.color} border-0 text-xs px-1.5 py-0`}
                >
                  {priorityConfig.label}
                </Badge>

                {task.deadline && (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 text-xs px-1.5 py-0"
                  >
                    <Calendar className="w-3 h-3" />
                    {format(new Date(task.deadline), "MMM d, HH:mm")}
                  </Badge>
                )}

                {/* Display created_date field */}
                {task.created_date && (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 text-xs px-1.5 py-0"
                  >
                    <Clock className="w-3 h-3" />
                    {format(new Date(task.created_date), "MMM d, yyyy")}
                  </Badge>
                )}

                {task.tags && task.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <TagIcon className="w-3 h-3 text-slate-400" />
                    {task.tags.slice(0, 2).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs px-1.5 py-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {task.tags.length > 2 && (
                      <span className="text-xs text-slate-500">
                        +{task.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {/* Progress bar and text - show here when condensed */}
                {condensedView && progress !== null && (
                  <div className="flex items-center gap-1">
                    <Progress value={progress} className="h-1.5 w-12" />{" "}
                    {/* Smaller progress bar */}
                    <span
                      className={`text-xs ${
                        isCompleted || task.status === "archived"
                          ? "text-green-600 font-medium"
                          : "text-slate-500"
                      }`}
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

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onAddSubtask(task)}
                className="h-7 w-7 text-green-600 hover:text-green-800 hover:bg-green-50"
                title="Add subtask"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(task)}
                className="h-7 w-7 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                title="Edit task"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-600 hover:text-red-800 hover:bg-red-50"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
