"use client";

import { createPost } from "@/app/actions/news";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Type, AlignLeft } from "lucide-react";

export default function CreatePostPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        const result = await createPost(formData);

        if (result.error) {
            alert(result.error);
            setLoading(false);
        } else {
            router.push("/dashboard/news");
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Draft New Directive</h1>

            <form action={handleSubmit} className="space-y-6 bg-zinc-900 border border-white/10 p-8 rounded-xl">
                <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2">Subject (Title)</label>
                    <div className="relative">
                        <Type className="absolute left-3 top-3 h-5 w-5 text-zinc-600" />
                        <input name="title" required className="w-full bg-black pl-10 pr-4 py-3 rounded-lg border border-white/10 focus:border-[#2b8cee] focus:outline-none text-white" placeholder="e.g. Server Maintenance" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2">Category</label>
                    <select name="type" className="w-full bg-black px-4 py-3 rounded-lg border border-white/10 focus:border-[#2b8cee] focus:outline-none text-white">
                        <option value="NEWS">News / Announcement</option>
                        <option value="GUIDE">Strategy Guide</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2">Message Content</label>
                    <div className="relative">
                        <AlignLeft className="absolute left-3 top-3 h-5 w-5 text-zinc-600" />
                        <textarea name="content" required rows={10} className="w-full bg-black pl-10 pr-4 py-3 rounded-lg border border-white/10 focus:border-[#2b8cee] focus:outline-none text-white font-mono text-sm" placeholder="Write your report here..." />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#2b8cee] hover:bg-[#2b8cee]/90 text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Publish to Alliance"}
                </button>
            </form>
        </div>
    );
}
