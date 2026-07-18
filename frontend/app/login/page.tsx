"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle2 } from "lucide-react";

const HIGHLIGHTS = [
  "CRM built for travel agencies",
  "Itineraries, vouchers & billing in one place",
  "Manage your team and track every lead",
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      login(data.access_token, data.user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex font-sans text-foreground">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-primary to-blue-700 text-primary-foreground p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_left,_white,_transparent_60%)] pointer-events-none" />

        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-2xl">
            P
          </div>
          <span className="text-2xl font-bold tracking-tight">TripPilot</span>
        </div>

        <div className="z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Build Unforgettable
              <br />
              Journeys.
            </h1>
            <p className="mt-4 text-primary-foreground/80 text-lg max-w-md">
              Everything your travel agency needs to turn leads into memorable trips.
            </p>
          </div>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-primary-foreground/90">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-primary-foreground/60 z-10">
          © {new Date().getFullYear()} TripPilot. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          {/* Mobile-only brand */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
              P
            </div>
            <span className="text-xl font-bold tracking-tight">TripPilot</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to your TripPilot account.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-sm font-semibold">
                Email address
              </Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@agency.com"
                className="h-11 bg-muted border-transparent focus:bg-background focus:border-primary focus:ring-1 focus:ring-ring transition-colors"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-sm font-semibold">
                  Password
                </Label>
                <a href="#" className="text-xs font-medium text-primary hover:underline">
                  Forgot your password?
                </a>
              </div>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="h-11 bg-muted border-transparent focus:bg-background focus:border-primary focus:ring-1 focus:ring-ring transition-colors"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="py-2 h-auto text-sm">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              id="login-submit"
              type="submit"
              className="w-full h-11 text-base font-semibold"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Log In"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Need an account? Contact the TripPilot team to onboard your agency.
          </p>
        </div>
      </div>
    </div>
  );
}
