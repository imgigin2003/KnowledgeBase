import React, { useState, useEffect, useRef } from "react";
import { Task } from "@/entities/Task";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Plus,
  CheckSquare,
  Search,
  FileText,
  Upload,
  ChevronDown,
  Rows3, // Icon for condensed view
  List, // Icon for normal view
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle"; // Assuming you have a Toggle component

import TaskTree from "../components/tasks/TaskTree";
import TaskEditor from "../components/tasks/TaskEditor";
import TaskFilters from "../components/tasks/TaskFilters";

export default function TaskManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    priority: "all",
    status: "all",
    color: "all",
    tags: [],
    dateRange: { from: undefined, to: undefined }, // Initialize with 'from' and 'to' for shadcn Calendar
  });
  const [selectedFile, setSelectedFile] = useState("reminders.json");
  const [taskFiles, setTaskFiles] = useState(["reminders.json"]);
  const [condensedView, setCondensedView] = useState(false); // New: condensed view toggle
  const fileInputRef = useRef(null);

  const queryClient = useQueryClient();

  // Fetch available task files
  useEffect(() => {
    const loadTaskFiles = async () => {
      try {
        const files = await Task.getTaskFiles();
        setTaskFiles(files);
      } catch (error) {
        console.error("Error loading task files:", error);
      }
    };
    loadTaskFiles();
  }, []);

  // Fetch tasks from selected file
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", selectedFile],
    queryFn: () => Task.list("-created_date", selectedFile),
    initialData: [],
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => Task.create(taskData, selectedFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", selectedFile] });
      setShowEditor(false);
      setEditingTask(null);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, taskData }) => Task.update(id, taskData, selectedFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", selectedFile] });
      setShowEditor(false);
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => Task.delete(id, selectedFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", selectedFile] });
    },
  });

  const handleSaveTask = (taskData) => {
    if (editingTask && editingTask.id) {
      updateTaskMutation.mutate({ id: editingTask.id, taskData });
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowEditor(true);
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTaskMutation.mutateAsync(taskId);
  };

  const handleStatusChange = (task, newStatus) => {
    updateTaskMutation.mutate({
      id: task.id,
      taskData: { ...task, status: newStatus },
    });
  };

  const handleAddSubtask = (parentTask) => {
    setEditingTask({
      parent_id: parentTask.id,
      name: "",
      description: "",
      priority: parentTask.priority || "medium",
      status: "created",
      color: parentTask.color || "blue",
      tags: [],
      deadline: "",
    });
    setShowEditor(true);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await Task.uploadTaskFile(file);
      setTaskFiles((prev) => [...prev, result.filename]);
      setSelectedFile(result.filename);
      queryClient.invalidateQueries({ queryKey: ["tasks", result.filename] });
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(
        error.message ||
          "Failed to upload file. Please ensure it's a valid JSON file with tasks array."
      );
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Build tree structure - no change needed here
  const buildTree = (tasks, parentId = null) => {
    return tasks
      .filter((task) => task.parent_id === parentId)
      .map((task) => ({
        ...task,
        children: buildTree(tasks, task.id),
      }));
  };

  // Filter tasks - MODIFIED to include date filtering and archived status logic
  const filterTasks = (allTasks) => {
    return allTasks.filter((task) => {
      // 3. Archive status behavior: Hide archived tasks by default unless explicitly filtered
      if (task.status === "archived" && filters.status !== "archived") {
        return false;
      }

      const matchesSearch =
        !searchTerm ||
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPriority =
        filters.priority === "all" || task.priority === filters.priority;
      const matchesStatus =
        filters.status === "all" || task.status === filters.status;
      const matchesColor =
        filters.color === "all" || task.color === filters.color;
      const matchesTags =
        filters.tags.length === 0 ||
        filters.tags.some((tag) => task.tags?.includes(tag));

      // 1. Search by date filter - use 'from' and 'to'
      const taskCreatedDate = task.created_date
        ? new Date(task.created_date)
        : null;
      const matchesStartDate = filters.dateRange?.from
        ? taskCreatedDate && taskCreatedDate >= filters.dateRange.from
        : true;
      const matchesEndDate = filters.dateRange?.to
        ? taskCreatedDate && taskCreatedDate <= filters.dateRange.to
        : true;

      return (
        matchesSearch &&
        matchesPriority &&
        matchesStatus &&
        matchesColor &&
        matchesTags &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  };

  const filteredTasks = filterTasks(tasks);
  const taskTree = buildTree(filteredTasks);
  const allTags = [...new Set(tasks.flatMap((t) => t.tags || []))];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-6 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8" dir="ltr">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <CheckSquare className="w-8 h-8 text-blue-600" />
              Task Manager
            </h1>
            <p className="text-slate-600 mt-2">
              Organize tasks with unlimited nested subtasks
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* 4. Toggle for condensed layout */}
            <Toggle
              pressed={condensedView}
              onPressedChange={setCondensedView}
              aria-label="Toggle condensed view"
              className="text-slate-600 hover:text-blue-600 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-600"
            >
              {condensedView ? (
                <Rows3 className="h-5 w-5" />
              ) : (
                <List className="h-5 w-5" />
              )}
            </Toggle>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="max-w-[150px] truncate">{selectedFile}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {taskFiles.map((file) => (
                  <DropdownMenuItem
                    key={file}
                    onClick={() => setSelectedFile(file)}
                    className={selectedFile === file ? "bg-slate-100" : ""}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="truncate">{file}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload JSON File
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json, application/json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <Button
              onClick={() => {
                setEditingTask(null);
                setShowEditor(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <TaskFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableTags={allTags}
            />
          </CardContent>
        </Card>

        {taskTree.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <CheckSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No tasks yet
              </h3>
              <p className="text-slate-600 mb-4">
                Create your first task to get started
              </p>
              <Button
                onClick={() => {
                  setEditingTask(null);
                  setShowEditor(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create First Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <TaskTree
                tasks={taskTree}
                allTasks={tasks}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
                onAddSubtask={handleAddSubtask}
                condensedView={condensedView}
              />
            </CardContent>
          </Card>
        )}

        {showEditor && (
          <TaskEditor
            task={editingTask}
            onSave={handleSaveTask}
            onCancel={() => {
              setShowEditor(false);
              setEditingTask(null);
            }}
            availableTags={allTags}
          />
        )}
      </div>
    </div>
  );
}
