import React, { useState } from "react";
import TaskItem from "./TaskItem";

export default function TaskTree({
  tasks,
  allTasks,
  onEdit,
  onDelete,
  onStatusChange,
  onAddSubtask,
  level = 0,
  condensedView, // New: condensedView prop
}) {
  const [expandedTasks, setExpandedTasks] = useState(
    new Set(tasks.map((t) => t.id))
  );

  const toggleExpand = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  return (
    <div
      className={
        level > 0 ? "ml-6 border-l-2 border-slate-200 pl-3 mt-0" : "space-y-1"
      }
    >
      {tasks.map((task) => {
        const isExpanded = expandedTasks.has(task.id);
        const hasChildren = task.children && task.children.length > 0;

        return (
          <div key={task.id}>
            <TaskItem
              task={task}
              allTasks={allTasks}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onAddSubtask={onAddSubtask}
              level={level}
              isExpanded={isExpanded}
              onToggleExpand={toggleExpand}
              condensedView={condensedView} // Pass condensedView
            />
            {hasChildren && isExpanded && (
              <TaskTree
                tasks={task.children}
                allTasks={allTasks}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
                onAddSubtask={onAddSubtask}
                level={level + 1}
                condensedView={condensedView}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
