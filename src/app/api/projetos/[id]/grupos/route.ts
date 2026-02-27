import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, order } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  // Verify the project exists and is accessible (RLS will enforce this)
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", params.id)
    .single();

  if (!project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });

  const { data, error } = await supabase
    .from("project_groups")
    .insert({
      project_id: params.id,
      name: name.trim(),
      description: description?.trim() ?? null,
      order: order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
