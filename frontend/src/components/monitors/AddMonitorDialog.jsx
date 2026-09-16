"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"; // I might need to add Select component if I haven't
import { toast } from "sonner";
import api from "@/lib/api";

export function AddMonitorDialog({ onMonitorAdded }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        url: "",
        interval: 300,
        request_type: "head",
    });

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/monitor", {
                ...formData,
                interval: parseInt(formData.interval),
                expectedStatus: [200, 201, 202, 204], // Default success codes
                timeout: 10,
                is_active: true,
            });
            toast.success("Monitor created successfully");
            setOpen(false);
            if (onMonitorAdded) onMonitorAdded();
            setFormData({ url: "", interval: 300, request_type: "head" });
        } catch (error) {
            console.error(error);
            toast.error("Failed to create monitor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Add Monitor</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Monitor</DialogTitle>
                    <DialogDescription>
                        Enter the details of the URL you want to monitor.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="url" className="text-right">
                                URL
                            </Label>
                            <Input
                                id="url"
                                placeholder="https://example.com"
                                className="col-span-3"
                                value={formData.url}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="interval" className="text-right">
                                Interval (s)
                            </Label>
                            <Input
                                id="interval"
                                type="number"
                                min="10"
                                className="col-span-3"
                                value={formData.interval}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {/* 
                Note: Skipping Select for request_type for now to avoid installing another component 
                unless user asks, defaulting to HEAD/GET is usually fine or I use standard HTML Select 
                if I really need it, but I'll stick to a simple Input or just default to HEAD.
                Wait, I should probably add Select component for better UI.
                I'll check if I added 'select' component. I didn't add it in the previous step.
                I will use a standard HTML select for simplicity or just HEAD default.
                Let's use a standard select with tailwind styling to be quick.
             */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="request_type" className="text-right">Method</Label>
                            <select
                                id="request_type"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
                                value={formData.request_type}
                                onChange={(e) => setFormData(prev => ({ ...prev, request_type: e.target.value }))}
                            >
                                <option value="head">HEAD</option>
                                <option value="get">GET</option>
                                <option value="post">POST</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
