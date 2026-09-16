"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Clock, Settings, TrendingUp, TrendingDown, Activity, Timer } from "lucide-react";
import { toast } from "sonner";
import useAuthStore from "@/store/auth";

export default function MonitorDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { isLoading, isAuthenticated, initialize } = useAuthStore();

    const [monitor, setMonitor] = useState(null);
    const [checks, setChecks] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        initialize();
    }, [initialize]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (!id || !isAuthenticated) return;

        const fetchData = async () => {
            try {
                // Fetch monitor details
                const monitorRes = await api.get(`/monitor/${id}`);
                setMonitor(monitorRes.data.data.monitor);

                // Fetch status checks
                const statusRes = await api.get(`/status/${id}`);
                // Backend returns { count: ..., records: [...] }
                const sortedRecords = (statusRes.data.data.records || []).sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
                setChecks(sortedRecords);
            } catch (error) {
                console.error(error);
                toast.error("Failed to fetch monitor details");
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
        // Poll every 5 seconds for updates
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [id, isAuthenticated]);

    // Calculate Metrics
    const stats = useMemo(() => {
        if (checks.length === 0) return { uptime: 0, avg: 0, min: 0, max: 0 };

        const total = checks.length;
        const upCount = checks.filter(c => c.status === 'up').length;
        const uptime = ((upCount / total) * 100).toFixed(2);

        const durations = checks.map(c => c.duration);
        const sum = durations.reduce((a, b) => a + b, 0);
        const avg = (sum / total).toFixed(0);
        const min = Math.min(...durations);
        const max = Math.max(...durations);

        return { uptime, avg, min, max };
    }, [checks]);

    if (isLoading || loadingData) {
        return <div className="flex h-screen items-center justify-center">Loading details...</div>;
    }

    if (!monitor) {
        return <div className="p-10 text-center">Monitor not found</div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background p-6">
            <div className="mb-6 flex justify-between items-center">
                <Link href="/dashboard">
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
                <Link href={`/monitors/${id}/edit`}>
                    <Button variant="outline" className="gap-2">
                        <Settings className="h-4 w-4" /> Settings
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.uptime}%</div>
                        <p className="text-xs text-muted-foreground">Overall availability</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                        <Timer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avg}ms</div>
                        <p className="text-xs text-muted-foreground">Average response time</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Min Latency</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.min}ms</div>
                        <p className="text-xs text-muted-foreground">Fastest response</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Max Latency</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.max}ms</div>
                        <p className="text-xs text-muted-foreground">Slowest response</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Monitor Info Card */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Monitor Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">URL</p>
                            <p className="text-lg font-bold break-all">{monitor.url}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Interval</p>
                            <p>{monitor.interval} seconds</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Type</p>
                            <p className="uppercase">{monitor.request_type}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Status</p>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${monitor.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                                {monitor.is_active ? "Active" : "Paused"}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* History / Checks */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Checks</CardTitle>
                        <CardDescription>Latest health checks performed for this URL</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border max-h-[500px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead className="text-right">Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {checks.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">
                                                No checks recorded yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        checks.map((check) => (
                                            <TableRow key={check._id}>
                                                <TableCell>
                                                    <span className={`font-semibold ${check.status === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                                        {check.status.toUpperCase()}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{check.status_code}</TableCell>
                                                <TableCell>{check.duration}ms</TableCell>
                                                <TableCell className="text-right flex items-center justify-end gap-2 text-xs text-muted-foreground">
                                                    {new Date(check.createdAt).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
