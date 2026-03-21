import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <Navbar />
      <main className="sm:ml-[260px] max-w-7xl px-4 sm:px-10 lg:px-14 py-8 pb-32 sm:pb-12 mt-14 sm:mt-0">
        {children}
      </main>
    </div>
  );
}
