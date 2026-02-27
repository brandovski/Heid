import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import ProjetoDetalhe from "./_components/ProjetoDetalhe";
import type { Project, ProjectGroup, ProjectGroupWithItems, ProjectItemWithRelations } from "../_components/types";
import type { Investment } from "@/app/(app)/investimentos/_components/types";

export default async function ProjetoDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: project },
    { data: groups },
    { data: items },
    { data: categories },
    { data: creditCards },
    { data: eligibleInvestments },
  ] = await Promise.all([
    supabase.from("projects").select("*").eq("id", params.id).single(),
    supabase
      .from("project_groups")
      .select("*")
      .eq("project_id", params.id)
      .order("order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("project_items")
      .select("*, credit_card:credit_cards(id, name, brand, color)")
      .eq("project_id", params.id)
      .order("created_at", { ascending: true }),
    supabase.from("categories").select("id, name").eq("is_active", true).order("name"),
    supabase.from("credit_cards").select("id, name, brand, color").eq("is_active", true).order("name"),
    supabase
      .from("investments")
      .select("id, name, type, scope, is_eligible_for_projects, is_active")
      .eq("is_eligible_for_projects", true)
      .eq("is_active", true),
  ]);

  if (!project) notFound();

  const groupList = (groups ?? []) as ProjectGroup[];
  const itemList = (items ?? []) as ProjectItemWithRelations[];

  const groupsWithItems: ProjectGroupWithItems[] = groupList.map((g) => ({
    ...g,
    items: itemList.filter((i) => i.project_group_id === g.id),
  }));

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-8">
      <ProjetoDetalhe
        project={project as Project}
        groups={groupsWithItems}
        categories={categories ?? []}
        creditCards={creditCards ?? []}
        eligibleInvestments={(eligibleInvestments ?? []) as Investment[]}
      />
    </div>
  );
}
