"use client";

import { createEvent } from "@/app/actions/events";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Calendar, MapPin, AlignLeft, Type } from "lucide-react";

export default function CreateEventPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        const result = await createEvent(formData);

        if (result.error) {
            alert(result.error);
            setLoading(false);
        } else {
            router.push("/dashboard/events");
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Initiate New Operation</h1>

            <form action={handleSubmit} className="space-y-6 bg-zinc-900 border border-white/10 p-8 rounded-xl">
                <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2">Operation Codename (Title)</label>
                    <div className="relative">
                        <Type className="absolute left-3 top-3 h-5 w-5 text-zinc-600" />
                        <input name="title" required className="w-full bg-black pl-10 pr-4 py-3 rounded-lg border border-white/10 focus:border-[#2b8cee] focus:outline-none text-white" placeholder="e.g. Fortress Siege Alpha" />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-zinc-400 mb-2">Operation Type</label>
                        <select name="type" className="w-full bg-black px-4 py-3 rounded-lg border border-white/10 focus:border-[#2b8cee] focus:outline-none text-white">
                            <option value="WAR">War / PvP</option>
                            <option value="GATHERING">Gathering</option>
                            <option value="SOCIAL">Social / Meeting</option>
                            <option value="DEFENSE">Defense</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-zinc-400 mb-2">Start Time (UTC)</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-5 w-5 text-zinc-600" />
                            <input name="startTime" type="datetime-local" required className="w-full bg-black pl-10 pr-4 py-3 rounded-lg border border-white/10 focus:border-[#2b8cee] focus:outline-none text-white [color-scheme:dark]" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2">Location / Coordinates</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-zinc-600" />
                        <input name="location" className="w-full bg-black pl-10 pr-4 py-3 rounded-lg border border-white/10 focus:border-[#2b8cee] focus:outline-none text-white" placeholder="e.g. X: 450 Y: 900" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2">Briefing (Description)</label>
                    <div className="relative">
                        <AlignLeft className="absolute left-3 top-3 h-5 w-5 text-zinc-600" />
                        <textarea name="description" rows={4} className="w-full bg-black pl-10 pr-4 py-3 rounded-lg border border-white/10 focus:border-[#2b8cee] focus:outline-none text-white" placeholder="Details about the operation..." />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#2b8cee] hover:bg-[#2b8cee]/90 text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Authorize Operation"}
                </button>
            </form>
        </div>
    );
}
