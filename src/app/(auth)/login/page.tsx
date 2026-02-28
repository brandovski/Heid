import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-block w-10 h-1 rounded-full bg-brand-600 mb-4" />
          <h1 className="text-4xl font-bold text-brand-700">Heid</h1>
          <p className="text-gray-500 mt-2">Gestão financeira do casal</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
