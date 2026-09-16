"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Trash2, ExternalLink, Activity } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function MonitorList({ refreshTrigger }) {
    const [monitors, setMonitors] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMonitors = async () => {
        try {
            const res = await api.get("/monitor");
            // The backend returns { monitors: [...] }
            setMonitors(res.data.data.monitors || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch monitors");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonitors();
    }, [refreshTrigger]);

    const handleDelete = async (id) => {
        // Confirm delete (could employ an Alert Dialog here, using simple confirm for speed)
        if (!confirm("Are you sure you want to delete this monitor?")) return;

        try {
            await api.delete(`/monitor/${id}`);
            toast.success("Monitor deleted");
            fetchMonitors();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete monitor");
        }
    };

    if (loading) {
        return <div className="text-center py-10">Loading monitors...</div>;
    }

    if (monitors.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                No monitors found. Add one to get started!
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {monitors.map((monitor) => (
                <Card key={monitor._id} className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium truncate max-w-[80%]">
                            {monitor.url}
                        </CardTitle>
                        {monitor.is_active ? (
                            <Activity className="h-4 w-4 text-green-500" />
                        ) : (
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            {/* Placeholder for status implementation. Real status requires fetching status checks. 
                   For now, we just show config info.
                   In a real app, I'd fetch the latest status check here or include it in the list API.
                */}
                            <Badge variant={monitor.is_active ? "default" : "secondary"}>
                                {monitor.is_active ? "Active" : "Paused"}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Interval: {monitor.interval}s | Type: {monitor.request_type.toUpperCase()}
                        </p>
                    </CardContent>
                    <CardFooter className="mt-auto flex justify-between pt-2">
                        <Link href={`/monitors/${monitor._id}`} passHref>
                            <Button variant="outline" size="sm">Details</Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => handleDelete(monitor._id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
