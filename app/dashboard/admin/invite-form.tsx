"use client";

import { generateInvite } from "@/app/actions/admin";
import { useState } from "react";
import { Plus, Copy, Check } from "lucide-react";

export function GenerateInviteForm() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ loginId: string; pin: string } | null>(null);
    const [copied, setCopied] = useState(false);

    async function handleGenerate() {
        setLoading(true);
        setResult(null);
        setCopied(false);

        const res = await generateInvite("R1");
        if (res.success && res.loginId && res.pin) {
            setResult({ loginId: res.loginId, pin: res.pin });
        } else {
            alert("Failed to generate invite");
        }
        setLoading(false);
    }

    function copyToClipboard() {
        if (!result) return;
        const text = `Welcome to the Alliance.\nYour Login ID: ${result.loginId}\nYour PIN: ${result.pin}\nLogin at: ${window.location.origin}/login`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="space-y-4">
            {!result ? (
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-[#2b8cee] hover:bg-[#2b8cee]/90 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    {loading ? "Generating..." : <><Plus className="h-5 w-5" /> Generate Credentials</>}
                </button>
            ) : (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-green-500 font-bold mb-2 flex items-center gap-2">
                        <Check className="h-4 w-4" /> Credentials Created
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-black/40 p-3 rounded">
                            <span className="text-xs text-zinc-500 block uppercase">Login ID</span>
                            <span className="font-mono text-xl font-bold text-white">{result.loginId}</span>
                        </div>
                        <div className="bg-black/40 p-3 rounded">
                            <span className="text-xs text-zinc-500 block uppercase">PIN Code</span>
                            <span className="font-mono text-xl font-bold text-white tracking-widest">{result.pin}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={copyToClipboard}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copied!" : "Copy Details"}
                        </button>
                        <button
                            onClick={() => setResult(null)}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded hover:text-white transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
