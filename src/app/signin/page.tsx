import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/SignInForm";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Come in",
  description: "Sign in with a magic link to add your light to the gathering.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getUser();
  if (user) redirect(next || "/read");

  return (
    <div className="mx-auto max-w-md px-5 py-20 sm:px-8">
      <header className="text-center">
        <p className="eyebrow">A place at the table</p>
        <h1 className="mt-4 font-serif text-3xl tracking-tight text-ink">
          Add your light
        </h1>
        <p className="mt-3 text-ink-soft">
          Sign in to offer a rendering, share the principles you read by, and let others
          know what resonates. Reading is always open to everyone.
        </p>
      </header>
      <div className="mt-10">
        <SignInForm next={next || "/read"} />
      </div>
    </div>
  );
}
