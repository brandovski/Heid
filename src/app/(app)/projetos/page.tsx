import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProjetoList from "./_components/ProjetoList";
import { computeProjectStats } from "./_components/types";
import type { Project, ProjectItem } from "./_components/types";

export default async function ProjetosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: projects }, { data: items }] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("project_items")
      .select("id, project_id, status, budget_amount, actual_amount, deposit_transaction_id, deposit_amount"),
  ]);

  const projectList = (projects ?? []) as Project[];
  const itemList = (items ?? []) as Pick<ProjectItem, "id" | "project_id" | "status" | "budget_amount" | "actual_amount" | "deposit_transaction_id" | "deposit_amount">[];

  const projectsWithStats = projectList.map((p) => {
    const projectItems = itemList.filter((i) => i.project_id === p.id) as ProjectItem[];
    return computeProjectStats(p, projectItems);
  });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-8">
      <ProjetoList initialProjects={projectsWithStats} />
    </div>
  );
}
