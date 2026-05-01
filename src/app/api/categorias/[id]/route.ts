import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.family_id)
    return NextResponse.json({ error: "Family not configured" }, { status: 400 });

  // Verificar se é categoria de sistema (imutável)
  const { data: categoria, error: categoriaError } = await supabase
    .from("categories")
    .select("is_system")
    .eq("id", id)
    .eq("family_id", profile.family_id)
    .single();

  if (categoriaError) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  if (categoria?.is_system) {
    return NextResponse.json({ error: "Categorias de sistema não podem ser alteradas" }, { status: 403 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.icon !== undefined) updates.icon = body.icon ?? null;
  if (body.color !== undefined) updates.color = body.color ?? null;
  if (body.is_active !== undefined) updates.is_active = body.is_active;
  if (body.type !== undefined) updates.type = body.type ?? null;

  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .eq("family_id", profile.family_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.family_id)
    return NextResponse.json({ error: "Family not configured" }, { status: 400 });

  // Verificar categoria
  const { data: categoria, error: categoriaError } = await supabase
    .from("categories")
    .select("id, is_active, is_system")
    .eq("id", id)
    .eq("family_id", profile.family_id)
    .single();

  if (categoriaError || !categoria)
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  if (categoria.is_system)
    return NextResponse.json({ error: "Categorias de sistema não podem ser excluídas" }, { status: 403 });
  if (categoria.is_active)
    return NextResponse.json({ error: "Arquive a categoria antes de excluir" }, { status: 400 });

  // Verificar vínculos
  const [txRes, fiRes, feRes, subRes] = await Promise.all([
    supabase.from("transactions").select("id").eq("category_id", id).limit(1),
    supabase.from("fixed_incomes").select("id").eq("category_id", id).limit(1),
    supabase.from("fixed_expenses").select("id").eq("category_id", id).limit(1),
    supabase.from("subscriptions").select("id").eq("category_id", id).limit(1),
  ]);

  const hasLinks =
    (txRes.data?.length ?? 0) > 0 ||
    (fiRes.data?.length ?? 0) > 0 ||
    (feRes.data?.length ?? 0) > 0 ||
    (subRes.data?.length ?? 0) > 0;

  if (hasLinks) {
    return NextResponse.json(
      { error: "Categoria ainda está vinculada a transações ou recorrências" },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("family_id", profile.family_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
