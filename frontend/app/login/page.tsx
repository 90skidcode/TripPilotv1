"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@trippilot.com");
  const [password, setPassword] = useState("password123");
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
      localStorage.setItem("trippilot_token", data.access_token);
      localStorage.setItem("trippilot_user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans text-foreground">
      <div className="w-full max-w-[420px]">
        
        {/* Form Card */}
        <Card className="bg-card shadow-sm border border-border rounded-lg overflow-hidden">
          
          {/* Osen style header: solid color top half */}
          <div className="bg-primary p-8 text-center text-primary-foreground flex flex-col items-center justify-center relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none"></div>
            
            {/* Logo */}
            <div className="w-12 h-12 rounded bg-white/20 flex items-center justify-center text-white font-bold text-2xl mb-4 backdrop-blur-sm z-10">
              P
            </div>
            <h2 className="text-2xl font-bold tracking-wide z-10">TripPilot</h2>
            <p className="text-primary-foreground/80 mt-2 text-sm z-10">Sign in to access your CRM.</p>
          </div>

          <CardContent className="p-8 pt-6 space-y-6 bg-card">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-slate-800">Welcome back</h3>
              <p className="text-sm text-slate-500 mt-1">Enter your email address and password.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-semibold text-slate-700">Email address</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="Enter your email"
                  className="bg-[#f1f3fa] border-transparent text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#727cf5] focus:ring-1 focus:ring-[#727cf5] h-11 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-sm font-semibold text-slate-700">Password</Label>
                  <a href="#" className="text-xs font-medium text-[#727cf5] hover:underline">Forgot your password?</a>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="bg-[#f1f3fa] border-transparent text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#727cf5] focus:ring-1 focus:ring-[#727cf5] h-11 transition-colors"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="py-2 h-auto text-sm border-red-200 bg-red-50 text-red-600">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                id="login-submit"
                type="submit"
                className="w-full bg-[#727cf5] hover:bg-[#616be8] text-white font-semibold h-11 text-base shadow-sm transition-all mt-2"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Log In"}
              </Button>
            </form>
          </CardContent>
          
          {/* Footer Demo Info */}
          <div className="bg-slate-50 border-t border-slate-100 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">
              Demo: admin@trippilot.com / password123
            </p>
          </div>
        </Card>

        {/* Background tagline */}
        <div className="mt-8 text-center">
          <p className="text-sm font-medium text-slate-400">
            © {new Date().getFullYear()} TripPilot. Build Unforgettable Journeys.
          </p>
        </div>
      </div>
    </div>
  );
}
