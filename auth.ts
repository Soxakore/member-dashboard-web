import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const prisma = new PrismaClient();
const LOGIN_ID_ALIASES: Record<string, string> = {
    ADMIN: "ADMIN00001",
};

async function getUser(loginId: string): Promise<any> {
    const user = await prisma.user.findUnique({
        where: { loginId },
    });
    return user;
}

function resolveLoginCandidates(rawLoginId: string): string[] {
    const normalized = rawLoginId.trim();
    if (!normalized) return [];

    const upper = normalized.toUpperCase();
    const alias = LOGIN_ID_ALIASES[upper];

    return [...new Set([normalized, upper, alias].filter(Boolean) as string[])];
}

const result = NextAuth({
    providers: [
        Credentials({
            name: "Dimensions ID",
            credentials: {
                loginId: { label: "ID", type: "text" },
                pin: { label: "PIN", type: "password" },
            },
            authorize: async (credentials) => {
                const parsedCredentials = z
                    .object({ loginId: z.string().min(1), pin: z.string().min(4) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { loginId, pin } = parsedCredentials.data;
                    const loginCandidates = resolveLoginCandidates(loginId);
                    let user: any = null;
                    for (const candidate of loginCandidates) {
                        user = await getUser(candidate);
                        if (user) break;
                    }

                    if (!user) return null;

                    const passwordsMatch = await bcrypt.compare(pin, user.pinHash);

                    if (passwordsMatch) {
                        const userObj = {
                            id: user.id,
                            name: user.username,
                            email: user.loginId,
                            image: user.avatarUrl,
                            role: user.role,
                        };
                        return userObj;
                    }
                }
                return null;
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                // Fetch latest role/data if needed, or rely on token
                const user = await getUser(session.user.email!); // email is loginId
                if (user) {
                    (session.user as any).role = user.role;
                    (session.user as any).loginId = user.loginId;
                }
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
            }
            return token;
        },
    },
    pages: {
        signIn: "/login",
    },
});

export const { handlers, signIn, signOut } = result;

export const auth = async (...args: any[]) => {
    const session = await (result.auth as any)(...args);
    return session;
};
