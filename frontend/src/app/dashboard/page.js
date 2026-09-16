"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/auth";
import { AddMonitorDialog } from "@/components/monitors/AddMonitorDialog";
import { MonitorList } from "@/components/monitors/MonitorList";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    const { user, isAuthenticated, isLoading, initialize, logout } = useAuthStore();
    const router = useRouter();
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        initialize();
    }, [initialize]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated) {
        return null; // Will redirect
    }

    const handleMonitorAdded = () => {
        setRefreshKey((prev) => prev + 1);
    };

    const handleLogout = () => {
        logout();
        router.push("/login"); // Force redirect after logout update
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="flex items-center justify-between py-4 px-6 border-b">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
                </div>
                <div className="flex items-center gap-4">
                    <AddMonitorDialog onMonitorAdded={handleMonitorAdded} />
                    <Button variant="outline" onClick={handleLogout}>Logout</Button>
                </div>
            </header>
            <main className="flex-1 p-6">
                <MonitorList refreshTrigger={refreshKey} />
            </main>
        </div>
    );
}
