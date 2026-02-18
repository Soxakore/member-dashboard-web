import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-transparent">
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative z-10 scroll-smooth lg:pt-0 pt-16">
                {children}
            </main>
        </div>
    );
}
