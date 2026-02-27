import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, family_id")
    .eq("id", user!.id)
    .single();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Olá, {profile?.full_name ?? user?.email}
      </h1>
      <p className="text-gray-500 mt-1">
        Dashboard será implementado na Fase 2.
      </p>
      {!profile?.family_id && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Configuração pendente:</strong> o{" "}
            <code>family_id</code> ainda não foi configurado neste perfil.
            Consulte o guia em <code>docs/setup.md</code>.
          </p>
        </div>
      )}
    </div>
  );
}
