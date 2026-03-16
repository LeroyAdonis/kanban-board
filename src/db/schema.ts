import { pgTable, text, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#6366f1"), // indigo default
  repoUrl: text("repo_url"),
  vercelUrl: text("vercel_url"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const kanbanTasks = pgTable("kanban_tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  column: text("column").notNull().default("backlog"),
  priority: text("priority").default("medium"),
  assignee: text("assignee"),
  tags: text("tags").array().default([]),
  insights: jsonb("insights").default("[]"),
  blockers: jsonb("blockers").default("[]"),
  challengeLog: jsonb("challenge_log").default("[]"),
  storyPoints: integer("story_points"),
  dueAt: timestamp("due_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type KanbanTask = typeof kanbanTasks.$inferSelect;
export type NewKanbanTask = typeof kanbanTasks.$inferInsert;

export const COLUMNS = ["backlog", "todo", "in_progress", "review", "done"] as const;
export const COLUMN_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};
export const PRIORITIES = ["low", "medium", "high", "critical"] as const;
