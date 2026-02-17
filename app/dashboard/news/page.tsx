import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { Plus, Newspaper, BookOpen } from "lucide-react";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function NewsPage() {
    const session = await auth();
    const user = await prisma.user.findUnique({
        where: { loginId: session?.user?.email || "" },
    });

    const posts = await prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            author: {
                select: { username: true, role: true }
            }
        }
    });

    const canPost = user?.role === "R4" || user?.role === "R5";

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Intel & Directives</h1>
                {canPost && (
                    <Link href="/dashboard/news/create" className="bg-[#2b8cee] hover:bg-[#2b8cee]/90 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                        <Plus className="h-5 w-5" /> New Report
                    </Link>
                )}
            </div>

            <div className="grid gap-8">
                {posts.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-white/5">
                        <Newspaper className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-zinc-400">No Intel Reports</h3>
                        <p className="text-zinc-500">All quiet on the western front.</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <div key={post.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-8 hover:bg-zinc-900 transition-colors">
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${post.type === "NEWS" ? "bg-red-500/20 text-red-500" : "bg-blue-500/20 text-blue-500"
                                    }`}>
                                    {post.type}
                                </span>
                                <span className="text-zinc-500 text-sm">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h2 className="text-2xl font-bold mb-4">{post.title}</h2>

                            <div className="prose prose-invert max-w-none mb-6 text-zinc-300 whitespace-pre-line">
                                {post.content}
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                    <span className="font-bold text-xs">{post.author.username?.[0]}</span>
                                </div>
                                <div className="text-sm">
                                    <span className="font-bold text-white">{post.author.username}</span>
                                    <span className="text-zinc-500 ml-2">[{post.author.role}]</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
