import { LoginForm } from "@/components/admin/login-form";

type AdminLoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center bg-zinc-50 px-4 py-8">
      <LoginForm nextPath={next ?? "/admin"} />
    </main>
  );
}
