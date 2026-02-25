import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Couple</h1>
          <p className="text-gray-500 mt-2">Gestão financeira do casal</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
