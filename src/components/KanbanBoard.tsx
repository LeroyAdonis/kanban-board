"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MoreHorizontal,
  Folder,
  ChevronRight,
  Zap,
  User,
  LayoutGrid,
  Inbox,
  CheckCircle2,
  Eye,
  Rocket,
  Layers,
  Settings2,
  ExternalLink,
  GitBranch,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

const COLUMN_CONFIG: Record<string, { icon: React.ReactNode; color: string; dotColor: string }> = {
  backlog: {
    icon: <Layers className="w-4 h-4" />,
    color: "text-slate-400",
    dotColor: "bg-slate-500",
  },
  todo: {
    icon: <Inbox className="w-4 h-4" />,
    color: "text-blue-400",
    dotColor: "bg-blue-500",
  },
  in_progress: {
    icon: <Rocket className="w-4 h-4" />,
    color: "text-amber-400",
    dotColor: "bg-amber-500",
  },
  review: {
    icon: <Eye className="w-4 h-4" />,
    color: "text-violet-400",
    dotColor: "bg-violet-500",
  },
  done: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: "text-emerald-400",
    dotColor: "bg-emerald-500",
  },
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "LOW",
  medium: "MED",
  high: "HIGH",
  critical: "CRIT",
};

const DEFAULT_PROJECT_COLORS = [
  "#818cf8",
  "#a78bfa",
  "#fb7185",
  "#fbbf24",
  "#34d399",
  "#38bdf8",
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
    color: "#818cf8",
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
      setProjectForm({ name: "", description: "", color: "#818cf8", repoUrl: "", vercelUrl: "" });
    } catch (err) {
      console.error("Failed to save project:", err);
    }
  };

  const openEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || "",
      color: project.color || "#818cf8",
      repoUrl: project.repoUrl || "",
      vercelUrl: project.vercelUrl || "",
    });
    setShowProjectDialog(true);
  };

  const expandedTaskData = expandedTask ? tasks.find((t) => t.id === expandedTask) : null;

  const getNextColumnLabel = (column: string) => {
    const nextIdx = COLUMNS.indexOf(column as typeof COLUMNS[number]) + 1;
    return nextIdx < COLUMNS.length ? COLUMN_LABELS[COLUMNS[nextIdx]] : null;
  };

  const totalTasks = tasks.length;
  const doneTasks = getColumnTasks("done").length;

  return (
    <div className="noise-overlay flex h-screen bg-background text-foreground overflow-hidden">
      {/* Ambient glow */}
      <div className="ambient-glow" />

      {/* Sidebar */}
      <aside className="relative z-10 w-64 border-r border-border bg-sidebar flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-foreground leading-tight">
                Kanban
              </h1>
              <p className="font-meta text-text-muted">command center</p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="px-5 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-meta text-text-muted uppercase">Tasks</p>
              <p className="text-lg font-semibold text-foreground">{totalTasks}</p>
            </div>
            <div className="text-right">
              <p className="font-meta text-text-muted uppercase">Done</p>
              <p className="text-lg font-semibold text-accent-emerald">{doneTasks}</p>
            </div>
            <div className="text-right">
              <p className="font-meta text-text-muted uppercase">Progress</p>
              <p className="text-lg font-semibold text-primary">
                {totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1 rounded-full bg-ink-mid overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent-violet"
              initial={{ width: 0 }}
              animate={{ width: `${totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Projects list */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-5 py-2">
            <p className="font-meta text-text-muted uppercase tracking-wider">View</p>
          </div>

          <button
            onClick={() => setSelectedProjectId(null)}
            className={`w-full flex items-center gap-3 px-5 py-2 text-sm transition-all duration-150 ${
              selectedProjectId === null
                ? "sidebar-active text-foreground bg-accent/50"
                : "text-text-secondary hover:text-foreground hover:bg-accent/30"
            }`}
          >
            <Folder className="w-4 h-4 opacity-60" />
            <span>All Projects</span>
            <span className="ml-auto font-meta text-text-muted">{totalTasks}</span>
          </button>

          <div className="px-5 py-3 mt-1">
            <p className="font-meta text-text-muted uppercase tracking-wider">Projects</p>
          </div>

          {projects.map((project) => {
            const projectTasks = tasks.filter((t) => t.projectId === project.id);
            return (
              <div
                key={project.id}
                className={`group relative flex items-center gap-3 px-5 py-2 text-sm transition-all duration-150 cursor-pointer ${
                  selectedProjectId === project.id
                    ? "sidebar-active text-foreground bg-accent/50"
                    : "text-text-secondary hover:text-foreground hover:bg-accent/30"
                }`}
                onClick={() => setSelectedProjectId(project.id)}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-background"
                  style={{
                    backgroundColor: project.color,
                    boxShadow: selectedProjectId === project.id
                      ? `0 0 8px ${project.color}40`
                      : "none",
                  }}
                />
                <span className="truncate flex-1">{project.name}</span>
                <span className="font-meta text-text-muted">{projectTasks.length}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditProject(project);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-accent rounded"
                >
                  <Settings2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add project */}
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-text-secondary hover:text-foreground hover:bg-accent border border-dashed border-border-subtle"
            onClick={() => {
              setEditingProject(null);
              setProjectForm({
                name: "",
                description: "",
                color: "#818cf8",
                repoUrl: "",
                vercelUrl: "",
              });
              setShowProjectDialog(true);
            }}
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      </aside>

      {/* Main Board */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {selectedProjectId ? (
              <>
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      getProject(selectedProjectId)?.color || "#818cf8",
                  }}
                />
                <h2 className="text-base font-semibold tracking-tight">
                  {getProject(selectedProjectId)?.name}
                </h2>
                {getProject(selectedProjectId)?.description && (
                  <span className="text-sm text-text-muted hidden md:inline">
                    — {getProject(selectedProjectId)?.description}
                  </span>
                )}
              </>
            ) : (
              <>
                <h2 className="text-base font-semibold tracking-tight">All Projects</h2>
                <span className="text-sm text-text-muted hidden md:inline">
                  — overview across all projects
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-meta text-text-muted bg-accent px-2.5 py-1 rounded-md">
              {tasks.length} tasks
            </span>
          </div>
        </header>

        {/* Columns */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-5">
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map((column) => {
              const colTasks = getColumnTasks(column);
              const config = COLUMN_CONFIG[column];
              return (
                <div
                  key={column}
                  className="w-72 flex flex-col rounded-xl bg-surface border border-border-subtle"
                >
                  {/* Column Header */}
                  <div className="px-4 py-3.5 flex items-center justify-between border-b border-border-subtle/50">
                    <div className="flex items-center gap-2.5">
                      <span className={`column-dot ${config.dotColor}`} />
                      <span className={`${config.color}`}>
                        {config.icon}
                      </span>
                      <h3 className="text-sm font-semibold text-text-primary">
                        {COLUMN_LABELS[column]}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-meta text-text-muted bg-ink-mid px-2 py-0.5 rounded-md min-w-[1.5rem] text-center">
                        {colTasks.length}
                      </span>
                      <button
                        onClick={() => setAddTaskColumn(column)}
                        className="p-1 hover:bg-ink-hover rounded-md transition-colors text-text-muted hover:text-text-secondary"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Add Task Inline */}
                  <AnimatePresence>
                    {addTaskColumn === column && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 space-y-2 border-b border-border-subtle/50">
                          <Input
                            placeholder="Task title..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddTask(column);
                              if (e.key === "Escape") setAddTaskColumn(null);
                            }}
                            autoFocus
                            className="bg-ink-mid border-border-subtle text-sm h-9 placeholder:text-text-muted"
                          />
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-primary/90 hover:bg-primary"
                              onClick={() => handleAddTask(column)}
                              disabled={!newTaskTitle.trim()}
                            >
                              Add
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-text-muted hover:text-foreground"
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
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                    {colTasks.length === 0 ? (
                      <div className="empty-grid h-24 flex items-center justify-center rounded-lg border border-dashed border-border-subtle">
                        <p className="font-meta text-text-muted">no tasks</p>
                      </div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {colTasks.map((task) => {
                          const project = getProject(task.projectId);
                          return (
                            <motion.div
                              key={task.id}
                              layout
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.96 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="group card-lift priority-stripe bg-surface-raised hover:bg-ink-hover border border-border-subtle hover:border-border-active rounded-lg pl-4 pr-3 py-3 cursor-pointer"
                              data-priority={task.priority || "medium"}
                              onClick={() => {
                                setExpandedTask(task.id);
                                setTaskEditForm(task);
                              }}
                            >
                              {/* Project indicator */}
                              {selectedProjectId === null && project && (
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: project.color }}
                                  />
                                  <span className="font-meta text-text-muted">
                                    {project.name}
                                  </span>
                                </div>
                              )}

                              {/* Title */}
                              <p className="text-[13px] font-medium text-text-primary leading-snug mb-2">
                                {task.title}
                              </p>

                              {/* Meta row */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {task.priority && (
                                  <span className="font-meta text-[10px] px-1.5 py-0.5 rounded bg-ink-mid text-text-muted border border-border-subtle">
                                    {PRIORITY_LABELS[task.priority] || task.priority.toUpperCase()}
                                  </span>
                                )}
                                {task.storyPoints != null && (
                                  <span className="flex items-center gap-0.5 font-meta text-[10px] text-text-muted">
                                    <Zap className="w-2.5 h-2.5" />
                                    {task.storyPoints}sp
                                  </span>
                                )}
                                {task.assignee && (
                                  <span className="flex items-center gap-0.5 font-meta text-[10px] text-text-muted">
                                    <User className="w-2.5 h-2.5" />
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
                                      className="font-meta text-[10px] px-1.5 py-0.5 rounded-md bg-ink-mid/60 text-text-muted"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Move button */}
                              {column !== "done" && (
                                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
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
                                    className="flex items-center gap-1 font-meta text-[10px] text-text-muted hover:text-primary transition-colors"
                                  >
                                    <ChevronRight className="w-3 h-3" />
                                    → {getNextColumnLabel(column)}
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              );
            })}
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
        <DialogContent className="max-w-lg bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-base">Task Details</DialogTitle>
            <DialogDescription className="text-text-muted font-meta">
              View and edit task information
            </DialogDescription>
          </DialogHeader>
          {expandedTaskData && (
            <div className="space-y-4">
              <div>
                <label className="font-meta text-text-muted mb-1.5 block uppercase text-[10px]">
                  Title
                </label>
                <Input
                  value={taskEditForm.title || ""}
                  onChange={(e) =>
                    setTaskEditForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="bg-ink-mid border-border-subtle text-sm"
                />
              </div>
              <div>
                <label className="font-meta text-text-muted mb-1.5 block uppercase text-[10px]">
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
                  className="bg-ink-mid border-border-subtle min-h-[80px] text-sm"
                  placeholder="Add a description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-meta text-text-muted mb-1.5 block uppercase text-[10px]">
                    Priority
                  </label>
                  <Select
                    value={taskEditForm.priority || "medium"}
                    onValueChange={(v) =>
                      setTaskEditForm((f) => ({ ...f, priority: v }))
                    }
                  >
                    <SelectTrigger className="bg-ink-mid border-border-subtle text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border-subtle">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-meta text-text-muted mb-1.5 block uppercase text-[10px]">
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
                    className="bg-ink-mid border-border-subtle text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="font-meta text-text-muted mb-1.5 block uppercase text-[10px]">
                  Assignee
                </label>
                <Input
                  value={taskEditForm.assignee || ""}
                  onChange={(e) =>
                    setTaskEditForm((f) => ({ ...f, assignee: e.target.value }))
                  }
                  className="bg-ink-mid border-border-subtle text-sm"
                  placeholder="Who's working on this?"
                />
              </div>
              <div>
                <label className="font-meta text-text-muted mb-1.5 block uppercase text-[10px]">
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
                  className="bg-ink-mid border-border-subtle text-sm"
                  placeholder="frontend, bug, urgent"
                />
              </div>
              {expandedTaskData.column !== "done" && (
                <div>
                  <label className="font-meta text-text-muted mb-1.5 block uppercase text-[10px]">
                    Column
                  </label>
                  <Select
                    value={expandedTaskData.column}
                    onValueChange={(v) => {
                      if (v) handleMoveTask(expandedTaskData.id, v);
                    }}
                  >
                    <SelectTrigger className="bg-ink-mid border-border-subtle text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border-subtle">
                      {COLUMNS.map((col) => (
                        <SelectItem key={col} value={col}>
                          {COLUMN_LABELS[col]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              size="sm"
              className="text-xs"
              onClick={() =>
                expandedTaskData && handleDeleteTask(expandedTaskData.id)
              }
            >
              Delete
            </Button>
            <Button
              size="sm"
              className="text-xs bg-primary/90 hover:bg-primary"
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
        <DialogContent className="max-w-md bg-popover border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-base">
              {editingProject ? "Edit Project" : "New Project"}
            </DialogTitle>
            <DialogDescription className="text-text-muted font-meta">
              {editingProject
                ? "Update project details"
                : "Create a new project to track"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="font-meta text-text-muted mb-1.5 block uppercase text-[10px]">
                Name
              </label>
              <Input
                value={projectForm.name}
                onChange={(e) =>
                  setProjectForm((f) => ({ ...f, name: e.target.value }))
                }
                className="bg-ink-mid border-border-subtle text-sm"
                placeholder="Project name"
              />
            </div>
            <div>
              <label className="font-meta text-text-muted mb-1.5 block uppercase text-[10px]">
                Description
              </label>
              <Textarea
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm((f) => ({ ...f, description: e.target.value }))
                }
                className="bg-ink-mid border-border-subtle text-sm"
                placeholder="Brief description"
              />
            </div>
            <div>
              <label className="font-meta text-text-muted mb-1.5 block uppercase text-[10px]">
                Color
              </label>
              <div className="flex gap-2">
                {DEFAULT_PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setProjectForm((f) => ({ ...f, color }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ${
                      projectForm.color === color
                        ? "border-foreground scale-110 shadow-lg"
                        : "border-transparent hover:scale-105 opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="font-meta text-text-muted mb-1.5 block uppercase text-[10px]">
                Repo URL
              </label>
              <Input
                value={projectForm.repoUrl}
                onChange={(e) =>
                  setProjectForm((f) => ({ ...f, repoUrl: e.target.value }))
                }
                className="bg-ink-mid border-border-subtle text-sm"
                placeholder="https://github.com/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              className="text-xs bg-primary/90 hover:bg-primary"
              onClick={handleSaveProject}
              disabled={!projectForm.name.trim()}
            >
              {editingProject ? "Save" : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
