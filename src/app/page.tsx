import KanbanBoard from "@/components/KanbanBoard";

// Default projects for first-time setup
const DEFAULT_PROJECTS = [
  {
    id: "proj-kitfix",
    name: "KitFix",
    description: "Kit customization and repair platform",
    color: "#6366f1",
    repoUrl: null,
    vercelUrl: null,
    active: true,
  },
  {
    id: "proj-pgs",
    name: "PGS Redesign",
    description: "Purple Glow Social 2.0 redesign",
    color: "#8b5cf6",
    repoUrl: null,
    vercelUrl: null,
    active: true,
  },
  {
    id: "proj-nozar",
    name: "NoZar",
    description: "NoZar project",
    color: "#ec4899",
    repoUrl: null,
    vercelUrl: null,
    active: true,
  },
];

async function getProjects() {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/projects`, {
      cache: "no-store",
    });
    if (!res.ok) return DEFAULT_PROJECTS;
    const projects = await res.json();
    return projects.length > 0 ? projects : DEFAULT_PROJECTS;
  } catch {
    return DEFAULT_PROJECTS;
  }
}

export default async function Home() {
  const projects = await getProjects();

  return (
    <KanbanBoard initialProjects={projects} />
  );
}
