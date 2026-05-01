import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const INVESTMENT_TYPES = ["cofrinho", "cdb", "lci_lca", "tesouro_direto", "renda_variavel", "fii", "fundo", "previdencia", "cripto", "outro"] as const;

const createInvestimentoSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(200),
  type: z.enum(INVESTMENT_TYPES, { message: "Tipo de investimento inválido" }),
  scope: z.enum(["personal", "family"], { message: "Escopo inválido" }),
  description: z.string().max(500).optional().nullable(),
  goal_amount: z.coerce.number().positive().optional().nullable(),
  monthly_contribution_amount: z.coerce.number().positive().optional().nullable(),
  monthly_contribution_day: z.coerce.number().int().min(1).max(31).optional().nullable(),
  partner_contribution_amount: z.coerce.number().positive().optional().nullable(),
  partner_contribution_day: z.coerce.number().int().min(1).max(31).optional().nullable(),
  is_eligible_for_projects: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get("active") === "true";

  let query = supabase.from("investments").select("*").order("created_at", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("family_id")
    .eq("id", user.id)
    .single();

  if (!profile?.family_id) {
    return NextResponse.json({ error: "Family not configured" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = createInvestimentoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, type, scope, description, goal_amount, monthly_contribution_amount, monthly_contribution_day, partner_contribution_amount, partner_contribution_day, is_eligible_for_projects } = parsed.data;

  const hasAmount = monthly_contribution_amount != null;
  const hasDay = monthly_contribution_day != null;
  if (hasAmount !== hasDay) {
    return NextResponse.json(
      { error: "Valor e dia do aporte mensal devem ser definidos juntos" },
      { status: 400 }
    );
  }

  const hasPartnerAmount = partner_contribution_amount != null;
  const hasPartnerDay = partner_contribution_day != null;
  if (hasPartnerAmount !== hasPartnerDay) {
    return NextResponse.json(
      { error: "Valor e dia do aporte do parceiro devem ser definidos juntos" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("investments")
    .insert({
      family_id: profile.family_id,
      user_id: user.id,
      name: name.trim(),
      type,
      scope,
      description: description?.trim() ?? null,
      goal_amount: goal_amount ?? null,
      monthly_contribution_amount: monthly_contribution_amount ?? null,
      monthly_contribution_day: monthly_contribution_day ?? null,
      partner_contribution_amount: partner_contribution_amount ?? null,
      partner_contribution_day: partner_contribution_day ?? null,
      is_eligible_for_projects: is_eligible_for_projects ?? false,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
