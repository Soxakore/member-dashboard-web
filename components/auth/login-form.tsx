"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, User as UserIcon, Loader2 } from "lucide-react";

export function LoginForm() {
    const [loginId, setLoginId] = useState("");
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                loginId,
                pin,
                redirect: false,
            });

            if (result?.error) {
                setError("ACCESS DENIED: Invalid Credentials");
                setLoading(false);
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("SYSTEM ERROR: Please try again");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <div className="relative group">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-[#38bdf8] transition-colors" />
                    <input
                        type="text"
                        placeholder="OPERATOR ID"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#38bdf8]/50 focus:ring-1 focus:ring-[#38bdf8]/50 transition-all font-mono"
                        required
                    />
                </div>
                <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-[#38bdf8] transition-colors" />
                    <input
                        type="password"
                        placeholder="SECURITY PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#38bdf8]/50 focus:ring-1 focus:ring-[#38bdf8]/50 transition-all font-mono"
                        required
                    />
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wider text-center animate-shake">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full btn-frost py-3 rounded-lg font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "AUTHENTICATE"}
            </button>

            <div className="text-center">
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
                    Authorized Personnel Only • Secure 256-bit Encryption
                </p>
            </div>
        </form>
    );
}
