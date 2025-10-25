import { useState } from "react";
import { Task } from "@/entities/Task";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, CheckSquare, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  });

  const queryClient = useQueryClient();

  // Use the new Task entity for fetching
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => Task.list("-created_date"), // Now calls your backend API
    initialData: [],
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => Task.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.refetchQueries({ queryKey: ["tasks"] });
      setShowEditor(false);
      setEditingTask(null);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, taskData }) => Task.update(id, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.refetchQueries({ queryKey: ["tasks"] });
      setShowEditor(false);
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.refetchQueries({ queryKey: ["tasks"] });
    },
  });

  const handleSaveTask = (taskData) => {
    // Backend now handles ID generation
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
    // The backend will handle recursive deletion of subtasks
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
      priority: parentTask.priority || "medium", // Use parent's priority or default
      status: "created",
      color: parentTask.color || "blue", // Use parent's color or default
      tags: [],
      deadline: "",
    });
    setShowEditor(true);
  };

  // Build tree structure
  const buildTree = (tasks, parentId = null) => {
    return tasks
      .filter((task) => task.parent_id === parentId)
      .map((task) => ({
        ...task,
        children: buildTree(tasks, task.id),
      }));
  };

  // Filter tasks
  const filterTasks = (tasks) => {
    return tasks.filter((task) => {
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

      return (
        matchesSearch &&
        matchesPriority &&
        matchesStatus &&
        matchesColor &&
        matchesTags
      );
    });
  };

  const filteredTasks = filterTasks(tasks);
  const taskTree = buildTree(filteredTasks);

  // Get all unique tags
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
                allTasks={tasks} // Pass allTasks for progress calculation
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
                onAddSubtask={handleAddSubtask}
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
