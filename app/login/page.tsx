import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-[#0b1120] p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tighter text-white mb-2">SECURE ACCESS</h1>
                    <p className="text-zinc-400">Enter your credentials to access the command node</p>
                </div>
                <LoginForm />
            </div>
        </main>
    );
}
