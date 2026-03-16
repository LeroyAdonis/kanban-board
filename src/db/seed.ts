import { db } from "./index";
import { projects, kanbanTasks } from "./schema";

async function seed() {
  // Create projects
  const projectData = [
    { id: "kitfix", name: "KitFix 2.0", description: "Jersey repair service PWA", color: "#f59e0b", repoUrl: "https://github.com/LeroyAdonis/kitfix-2.0" },
    { id: "pgs", name: "PGS Redesign 2.0", description: "Purple Glow Social redesign", color: "#8b5cf6", repoUrl: "https://github.com/LeroyAdonis/pgs-redesign-2.0" },
    { id: "nozar", name: "NoZar", description: "Barter marketplace app", color: "#10b981", repoUrl: "https://github.com/LeroyAdonis/NoZar" },
    { id: "kanban", name: "Kanban Board", description: "This project - multi-project task tracker", color: "#6366f1", repoUrl: "https://github.com/LeroyAdonis/kanban-board" },
  ];

  for (const p of projectData) {
    await db.insert(projects).values(p).onConflictDoNothing();
  }

  // KitFix tasks from merged branch
  const kitfixTasks = [
    { id: "kf-001", projectId: "kitfix", title: "Verify AI damage analyzer (Puter.js) on production", column: "review", priority: "high", tags: ["ai", "production"] },
    { id: "kf-002", projectId: "kitfix", title: "Test quote workflow end-to-end (send/accept/decline)", column: "review", priority: "high", tags: ["payments", "e2e"] },
    { id: "kf-003", projectId: "kitfix", title: "Verify pickup fee calculation with metro detection", column: "review", priority: "medium", tags: ["payments", "geo"] },
    { id: "kf-004", projectId: "kitfix", title: "Run E2E test suite on production", column: "todo", priority: "medium", tags: ["testing"], storyPoints: 2 },
    { id: "kf-005", projectId: "kitfix", title: "Monitor Vercel deployment stability", column: "in_progress", priority: "high", tags: ["infra"] },
  ];

  // PGS tasks
  const pgsTasks = [
    { id: "pgs-001", projectId: "pgs", title: "Verify docs pages (scheduling, linking-accounts, ai-content) — 500 errors fixed", column: "review", priority: "high", tags: ["bugfix", "docs"] },
    { id: "pgs-002", projectId: "pgs", title: "Test auth success feedback after signup", column: "review", priority: "medium", tags: ["auth", "ux"] },
    { id: "pgs-003", projectId: "pgs", title: "Monitor ESLint build performance", column: "todo", priority: "low", tags: ["dx"] },
  ];

  // NoZar tasks
  const nozarTasks = [
    { id: "nz-001", projectId: "nozar", title: "Verify region-based feed filtering (Western Cape / Gauteng)", column: "review", priority: "high", tags: ["core", "geo"] },
    { id: "nz-002", projectId: "nozar", title: "Test AI match results scoped to region", column: "review", priority: "high", tags: ["ai", "geo"] },
    { id: "nz-003", projectId: "nozar", title: "Verify map pins center to active region", column: "todo", priority: "medium", tags: ["maps"] },
  ];

  // Kanban project tasks
  const kanbanTasksData = [
    { id: "kb-001", projectId: "kanban", title: "Add Vercel deployment to this board", column: "done", priority: "medium", tags: ["meta"] },
    { id: "kb-002", projectId: "kanban", title: "Set up drag-and-drop for task cards", column: "backlog", priority: "medium", tags: ["ux", "enhancement"], storyPoints: 5 },
    { id: "kb-003", projectId: "kanban", title: "Add GitHub issue sync", column: "backlog", priority: "low", tags: ["integration"], storyPoints: 8 },
  ];

  const allTasks = [...kitfixTasks, ...pgsTasks, ...nozarTasks, ...kanbanTasksData];
  for (const t of allTasks) {
    await db.insert(kanbanTasks).values(t as any).onConflictDoNothing();
  }

  console.log(`✅ Seeded ${projectData.length} projects and ${allTasks.length} tasks`);
}

seed().catch(console.error);
