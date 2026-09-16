"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import useAuthStore from "@/store/auth";
import Link from "next/link";

export default function EditMonitorPage() {
    const { id } = useParams();
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuthStore();

    const [formData, setFormData] = useState({
        url: "",
        interval: 300,
        request_type: "head",
        is_active: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (!id || !isAuthenticated) return;

        const fetchMonitor = async () => {
            try {
                const res = await api.get(`/monitor/${id}`);
                const monitor = res.data.data.monitor;
                setFormData({
                    url: monitor.url,
                    interval: monitor.interval,
                    request_type: monitor.request_type,
                    is_active: monitor.is_active
                });
            } catch (error) {
                console.error(error);
                toast.error("Failed to fetch monitor details");
                router.push("/dashboard");
            } finally {
                setLoading(false);
            }
        };

        fetchMonitor();
    }, [id, isAuthenticated, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Backend expects specific fields for update
            await api.patch(`/monitor/${id}`, {
                ...formData,
                interval: parseInt(formData.interval),
            });
            toast.success("Monitor updated successfully");
            router.push(`/monitors/${id}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update monitor");
        } finally {
            setSaving(false);
        }
    };

    if (loading || isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background p-6 items-center">
            <div className="w-full max-w-2xl">
                <div className="mb-6">
                    <Link href={`/monitors/${id}`}>
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back to Details
                        </Button>
                    </Link>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Monitor</CardTitle>
                        <CardDescription>Update configuration for {formData.url}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="url">URL</Label>
                                <Input
                                    id="url"
                                    value={formData.url}
                                    disabled // Usually URL shouldn't be changed, as it's the identity, but user might want to. Let's keep it editable? Actually backend might relay on it. Let's make it editable.
                                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">URL modification might reset stats tracking depending on backend implementation.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="interval">Interval (seconds)</Label>
                                <Input
                                    id="interval"
                                    type="number"
                                    min="10"
                                    value={formData.interval}
                                    onChange={(e) => setFormData(prev => ({ ...prev, interval: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="request_type">Request Method</Label>
                                <Select
                                    value={formData.request_type}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, request_type: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="head">HEAD</SelectItem>
                                        <SelectItem value="get">GET</SelectItem>
                                        <SelectItem value="post">POST</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.is_active ? "active" : "paused"}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, is_active: val === "active" }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="paused">Paused</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full" disabled={saving}>
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
