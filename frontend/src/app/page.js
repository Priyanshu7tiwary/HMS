"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, ShieldCheck, Zap } from "lucide-react";
import useAuthStore from "@/store/auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { isAuthenticated, initialize } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-6 py-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Activity className="h-6 w-6 text-primary" />
          <span>HealthMonitor</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight lg:text-7xl mb-6">
          Monitor your URLs <br className="hidden md:block" /> with confidence.
        </h1>
        <p className="max-w-[600px] text-muted-foreground md:text-xl mb-8">
          Real-time health checks, detailed uptime analytics, and instant alerts.
          Keep your services running smoothly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/register">
            <Button size="lg" className="w-full sm:w-auto">Start Monitoring For Free</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">Existing User?</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-5xl">
          <div className="flex flex-col items-center p-6 border rounded-xl bg-card">
            <Zap className="h-10 w-10 text-yellow-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Real-time Checks</h3>
            <p className="text-muted-foreground">Customizable intervals to check your services as often as you need.</p>
          </div>
          <div className="flex flex-col items-center p-6 border rounded-xl bg-card">
            <ShieldCheck className="h-10 w-10 text-green-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Reliable Uptime</h3>
            <p className="text-muted-foreground">Historical data and uptime calculation to track reliability over time.</p>
          </div>
          <div className="flex flex-col items-center p-6 border rounded-xl bg-card">
            <Activity className="h-10 w-10 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Detailed Analytics</h3>
            <p className="text-muted-foreground">In-depth insights into response times, status codes, and failure reasons.</p>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © 2026 HealthMonitor Inc. All rights reserved.
      </footer>
    </div>
  );
}
