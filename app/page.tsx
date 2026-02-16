import Link from "next/link";
import { ArrowRight, Shield, Calendar, Users, Target } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <header className="px-6 h-16 flex items-center justify-between border-b border-white/10 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <Shield className="h-6 w-6 text-[#2b8cee]" />
          <span>WAR<span className="text-[#2b8cee]">RIORS</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#about" className="hover:text-white transition-colors">About</Link>
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-[#2b8cee] transition-colors">
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-[#2b8cee] hover:bg-[#2b8cee]/90 text-white rounded-full px-4 py-2 text-sm font-medium transition-colors"
          >
            Join Alliance
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 px-6 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2b8cee]/20 via-transparent to-transparent opacity-50" />
          <div className="container mx-auto max-w-5xl relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[#2b8cee] mb-6 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-[#2b8cee] mr-2 animate-pulse"></span>
              Alliance War Command Center Live
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Dominate the Battlefield <br /> coordinate seamlessly.
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
              The ultimate dashboard for alliance management. Track events, coordinate wars, and manage members all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#2b8cee] px-8 text-sm font-medium text-white shadow-lg shadow-[#2b8cee]/20 transition-all hover:bg-[#2b8cee]/90 hover:scale-105"
              >
                Enter Command Center
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#features"
                className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-lg border border-white/10 bg-white/5 px-8 text-sm font-medium text-white transition-all hover:bg-white/10 backdrop-blur-sm"
              >
                View Operations
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Calendar,
                  title: "Event Scheduling",
                  desc: "Visualize upcoming wars and alliance events with a synchronized calendar.",
                },
                {
                  icon: Users,
                  title: "Member Management",
                  desc: "Track member activity, contributions, and rank promotions efficiently.",
                },
                {
                  icon: Target,
                  title: "War Planning",
                  desc: "Real-time coordination tools for alliance wars and strategic operations.",
                },
              ].map((feature, i) => (
                <div key={i} className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2b8cee]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <feature.icon className="h-10 w-10 text-[#2b8cee] mb-4" />
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-zinc-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 border-t border-white/10 text-center text-zinc-600 text-sm">
        <p>© 2026 Warriors Alliance. All rights reserved.</p>
      </footer>
    </div>
  );
}
