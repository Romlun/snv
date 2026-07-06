
"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-on-background">
      <Card className="w-full max-w-md space-y-8 p-8">
        <div className="space-y-5 text-center">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-sm ring-1 ring-outline-variant/15">
                <Image
                  src="/logo-mark.png"
                  alt=""
                  width={34}
                  height={34}
                  className="h-8 w-8 object-contain"
                  priority
                />
              </span>
              <span className="font-headline text-headline-md font-semibold leading-tight text-on-surface">
                Light in the East
              </span>
            </div>
          </div>
          <div>
            <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Welcome back. Enter your details to continue.
            </p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-on-surface">
                Email address
              </label>
              <Input
                type="email"
                required
                variant="box"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-on-surface">
                Password
              </label>
              <Input
                type="password"
                required
                variant="box"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
