import Link from "next/link";
import { Shield, Check, ArrowRight } from "lucide-react";

export default function JoinPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            {/* Hero Section */}
            <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-40 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

                <div className="relative z-10 text-center max-w-3xl px-6">
                    <div className="w-20 h-20 bg-[#2b8cee]/20 border border-[#2b8cee]/50 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                        <Shield className="h-10 w-10 text-[#2b8cee]" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
                        JOIN THE <span className="text-[#2b8cee]">ALLIANCE</span>
                    </h1>
                    <p className="text-xl text-zinc-300 leading-relaxed mb-10">
                        We are the guardians of the tundra. A brotherhood forged in ice and survival.
                        We seek dedicated warriors to dominate the battlefield and conquer the presidency.
                    </p>
                    <Link href="#requirements" className="bg-[#2b8cee] hover:bg-[#2b8cee]/90 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-[#2b8cee]/20">
                        View Requirements
                    </Link>
                </div>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    {[
                        { title: "Power Requirement", desc: "Minimum 20M Power (Subject to server age)" },
                        { title: "Activity Level", desc: "Daily login required. Participation in Bear Trap & Crazy Joe is mandatory." },
                        { title: "Communication", desc: "Must join our Discord server for war coordination." },
                        { title: "Furnace Level", desc: "Minimum Furnace Level 25+" },
                    ].map((req, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-1">
                                <Check className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl mb-1">{req.title}</h3>
                                <p className="text-zinc-400">{req.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8">
                    <h3 className="text-2xl font-bold mb-6">How to Apply</h3>
                    <div className="space-y-6">
                        <p className="text-zinc-300">
                            Applications are processed manually by our R4 leadership team.
                            To apply, please follow these steps:
                        </p>
                        <ol className="space-y-4 list-decimal list-inside text-zinc-300">
                            <li className="pl-2">Join our Recruitment Discord server.</li>
                            <li className="pl-2">Post a screenshot of your profile in the <span className="text-[#2b8cee] font-mono">#applications</span> channel.</li>
                            <li className="pl-2">Wait for an officer to review your stats.</li>
                            <li className="pl-2">If accepted, you will receive a unique <span className="text-white font-bold">Alliance ID</span> and <span className="text-white font-bold">PIN</span>.</li>
                        </ol>
                        <a href="#" className="block w-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-center font-bold py-4 rounded-xl transition-all mt-6">
                            Join Discord Server
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
