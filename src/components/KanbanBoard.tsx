"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MoreHorizontal,
  Folder,
  ChevronRight,
  GripVertical,
  Hash,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  repoUrl: string | null;
  vercelUrl: string | null;
  active: boolean;
}

interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  column: string;
  priority: string | null;
  assignee: string | null;
  tags: string[] | null;
  storyPoints: number | null;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const COLUMNS = ["backlog", "todo", "in_progress", "review", "done"] as const;
const COLUMN_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};
const COLUMN_COLORS: Record<string, string> = {
  backlog: "bg-slate-700/50",
  todo: "bg-blue-900/30",
  in_progress: "bg-amber-900/30",
  review: "bg-purple-900/30",
  done: "bg-emerald-900/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

const DEFAULT_PROJECT_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
];

export default function KanbanBoard({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [addTaskColumn, setAddTaskColumn] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    color: "#6366f1",
    repoUrl: "",
    vercelUrl: "",
  });
  const [taskEditForm, setTaskEditForm] = useState<Partial<Task>>({});

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedProjectId
        ? `/api/tasks?projectId=${selectedProjectId}`
        : "/api/tasks";
      const res = await fetch(url);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getProject = (id: string) => projects.find((p) => p.id === id);

  const getColumnTasks = (column: string) =>
    tasks.filter((t) => t.column === column);

  const handleAddTask = async (column: string) => {
    if (!newTaskTitle.trim()) return;
    const projectId = selectedProjectId || projects[0]?.id;
    if (!projectId) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          column,
          projectId,
        }),
      });
      const newTask = await res.json();
      setTasks((prev) => [...prev, newTask]);
      setNewTaskTitle("");
      setAddTaskColumn(null);
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  };

  const handleMoveTask = async (taskId: string, targetColumn: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          column: targetColumn,
          verified: targetColumn === "done" ? true : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error);
        return;
      }
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error("Failed to move task:", err);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, ...updates }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error);
        return;
      }
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks?id=${taskId}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setExpandedTask(null);
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleSaveProject = async () => {
    try {
      if (editingProject) {
        const res = await fetch("/api/projects", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingProject.id, ...projectForm }),
        });
        const updated = await res.json();
        setProjects((prev) =>
          prev.map((p) => (p.id === editingProject.id ? updated : p))
        );
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectForm),
        });
        const newProject = await res.json();
        setProjects((prev) => [...prev, newProject]);
      }
      setShowProjectDialog(false);
      setEditingProject(null);
      setProjectForm({ name: "", description: "", color: "#6366f1", repoUrl: "", vercelUrl: "" });
    } catch (err) {
      console.error("Failed to save project:", err);
    }
  };

  const openEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || "",
      color: project.color || "#6366f1",
      repoUrl: project.repoUrl || "",
      vercelUrl: project.vercelUrl || "",
    });
    setShowProjectDialog(true);
  };

  const expandedTaskData = expandedTask ? tasks.find((t) => t.id === expandedTask) : null;

  const getColumnIcon = (column: string) => {
    const nextIdx = COLUMNS.indexOf(column as typeof COLUMNS[number]) + 1;
    return nextIdx < COLUMNS.length ? COLUMN_LABELS[COLUMNS[nextIdx]] : null;
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {/* Sidebar - Project Switcher */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800">
          <h1 className="text-lg font-semibold tracking-tight">Kanban Board</h1>
          <p className="text-xs text-slate-500 mt-1">Multi-project tracker</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <button
            onClick={() => setSelectedProjectId(null)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedProjectId === null
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            }`}
          >
            <Folder className="w-4 h-4" />
            All Projects
          </button>

          <div className="mt-3 mb-2">
            <p className="px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Projects
            </p>
          </div>

          {projects.map((project) => (
            <div
              key={project.id}
              className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                selectedProjectId === project.id
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
              onClick={() => setSelectedProjectId(project.id)}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: project.color || "#6366f1" }}
              />
              <span className="truncate flex-1">{project.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditProject(project);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-700 rounded"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-800">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-slate-400 border-slate-700 hover:bg-slate-800"
            onClick={() => {
              setEditingProject(null);
              setProjectForm({
                name: "",
                description: "",
                color: "#6366f1",
                repoUrl: "",
                vercelUrl: "",
              });
              setShowProjectDialog(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add Project
          </Button>
        </div>
      </aside>

      {/* Main Board */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedProjectId ? (
              <>
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      getProject(selectedProjectId)?.color || "#6366f1",
                  }}
                />
                <h2 className="text-lg font-semibold">
                  {getProject(selectedProjectId)?.name}
                </h2>
              </>
            ) : (
              <h2 className="text-lg font-semibold">All Projects</h2>
            )}
          </div>
          <div className="text-sm text-slate-500">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </div>
        </header>

        {/* Columns */}
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-5 h-full min-w-max">
            {COLUMNS.map((column) => (
              <div
                key={column}
                className={`w-80 flex flex-col rounded-xl ${COLUMN_COLORS[column]} border border-slate-800/50`}
              >
                {/* Column Header */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-200">
                      {COLUMN_LABELS[column]}
                    </h3>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                      {getColumnTasks(column).length}
                    </span>
                  </div>
                  <button
                    onClick={() => setAddTaskColumn(column)}
                    className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                {/* Add Task Inline */}
                <AnimatePresence>
                  {addTaskColumn === column && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-3 overflow-hidden"
                    >
                      <div className="pb-3 space-y-2">
                        <Input
                          placeholder="Task title..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddTask(column);
                            if (e.key === "Escape") setAddTaskColumn(null);
                          }}
                          autoFocus
                          className="bg-slate-800 border-slate-700 text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddTask(column)}
                            disabled={!newTaskTitle.trim()}
                          >
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setAddTaskColumn(null);
                              setNewTaskTitle("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Task Cards */}
                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
                  <AnimatePresence mode="popLayout">
                    {getColumnTasks(column).map((task) => {
                      const project = getProject(task.projectId);
                      return (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="group bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-lg p-3 cursor-pointer transition-colors"
                          onClick={() => {
                            setExpandedTask(task.id);
                            setTaskEditForm(task);
                          }}
                        >
                          {/* Project indicator */}
                          {selectedProjectId === null && project && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: project.color }}
                              />
                              <span className="text-xs text-slate-500">
                                {project.name}
                              </span>
                            </div>
                          )}

                          {/* Title */}
                          <p className="text-sm font-medium text-slate-200 mb-2">
                            {task.title}
                          </p>

                          {/* Meta row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {task.priority && (
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}
                              >
                                {task.priority}
                              </span>
                            )}
                            {task.storyPoints != null && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Zap className="w-3 h-3" />
                                {task.storyPoints}
                              </span>
                            )}
                            {task.assignee && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <User className="w-3 h-3" />
                                {task.assignee}
                              </span>
                            )}
                          </div>

                          {/* Tags */}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {task.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Move button */}
                          {column !== "done" && (
                            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextIdx =
                                    COLUMNS.indexOf(
                                      column as typeof COLUMNS[number]
                                    ) + 1;
                                  if (nextIdx < COLUMNS.length) {
                                    handleMoveTask(task.id, COLUMNS[nextIdx]);
                                  }
                                }}
                                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                              >
                                <ChevronRight className="w-3 h-3" />
                                Move to {getColumnIcon(column)}
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Task Detail Dialog */}
      <Dialog
        open={!!expandedTask}
        onOpenChange={(open) => {
          if (!open) {
            setExpandedTask(null);
            setTaskEditForm({});
          }
        }}
      >
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Task Details</DialogTitle>
            <DialogDescription>
              View and edit task information
            </DialogDescription>
          </DialogHeader>
          {expandedTaskData && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Title
                </label>
                <Input
                  value={taskEditForm.title || ""}
                  onChange={(e) =>
                    setTaskEditForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Description
                </label>
                <Textarea
                  value={taskEditForm.description || ""}
                  onChange={(e) =>
                    setTaskEditForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  className="bg-slate-800 border-slate-700 min-h-[80px]"
                  placeholder="Add a description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">
                    Priority
                  </label>
                  <Select
                    value={taskEditForm.priority || "medium"}
                    onValueChange={(v) =>
                      setTaskEditForm((f) => ({ ...f, priority: v }))
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">
                    Story Points
                  </label>
                  <Input
                    type="number"
                    value={taskEditForm.storyPoints || ""}
                    onChange={(e) =>
                      setTaskEditForm((f) => ({
                        ...f,
                        storyPoints: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      }))
                    }
                    className="bg-slate-800 border-slate-700"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Assignee
                </label>
                <Input
                  value={taskEditForm.assignee || ""}
                  onChange={(e) =>
                    setTaskEditForm((f) => ({ ...f, assignee: e.target.value }))
                  }
                  className="bg-slate-800 border-slate-700"
                  placeholder="Who's working on this?"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Tags (comma separated)
                </label>
                <Input
                  value={(taskEditForm.tags || []).join(", ")}
                  onChange={(e) =>
                    setTaskEditForm((f) => ({
                      ...f,
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    }))
                  }
                  className="bg-slate-800 border-slate-700"
                  placeholder="frontend, bug, urgent"
                />
              </div>
              {expandedTaskData.column !== "done" && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">
                    Column
                  </label>
                  <Select
                    value={expandedTaskData.column}
                    onValueChange={(v) => {
                      if (v) handleMoveTask(expandedTaskData.id, v);
                    }}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {COLUMNS.map((col) => (
                        <SelectItem key={col} value={col}>
                          {COLUMN_LABELS[col]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-600 mt-1">
                    Cards can only move one column at a time
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() =>
                expandedTaskData && handleDeleteTask(expandedTaskData.id)
              }
            >
              Delete
            </Button>
            <Button
              onClick={() => {
                if (expandedTaskData) {
                  handleUpdateTask(expandedTaskData.id, taskEditForm);
                  setExpandedTask(null);
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Dialog */}
      <Dialog
        open={showProjectDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowProjectDialog(false);
            setEditingProject(null);
          }
        }}
      >
        <DialogContent className="max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              {editingProject ? "Edit Project" : "New Project"}
            </DialogTitle>
            <DialogDescription>
              {editingProject
                ? "Update project details"
                : "Create a new project to track"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Name</label>
              <Input
                value={projectForm.name}
                onChange={(e) =>
                  setProjectForm((f) => ({ ...f, name: e.target.value }))
                }
                className="bg-slate-800 border-slate-700"
                placeholder="Project name"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Description
              </label>
              <Textarea
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm((f) => ({ ...f, description: e.target.value }))
                }
                className="bg-slate-800 border-slate-700"
                placeholder="Brief description"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Color</label>
              <div className="flex gap-2">
                {DEFAULT_PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setProjectForm((f) => ({ ...f, color }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      projectForm.color === color
                        ? "border-white scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Repo URL
              </label>
              <Input
                value={projectForm.repoUrl}
                onChange={(e) =>
                  setProjectForm((f) => ({ ...f, repoUrl: e.target.value }))
                }
                className="bg-slate-800 border-slate-700"
                placeholder="https://github.com/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveProject} disabled={!projectForm.name.trim()}>
              {editingProject ? "Save" : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
