import type { SupabaseClient } from "@supabase/supabase-js";

export type SystemCategoryName = "Projeto" | "Caixa Familiar" | "Investimento";

export async function getSystemCategoryId(
  supabase: SupabaseClient,
  familyId: string,
  name: SystemCategoryName
): Promise<string | null> {
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("family_id", familyId)
    .eq("name", name)
    .eq("is_system", true)
    .single();
  return data?.id ?? null;
}
