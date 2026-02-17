import NextAuth, { User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const prisma = new PrismaClient();

async function getUser(loginId: string): Promise<any> {
    const user = await prisma.user.findUnique({
        where: { loginId },
    });
    return user;
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
                console.error("DEBUG: authorize called with:", JSON.stringify(credentials));
                const parsedCredentials = z
                    .object({ loginId: z.string(), pin: z.string().min(4) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { loginId, pin } = parsedCredentials.data;
                    console.error("DEBUG: parsed success. loginId:", loginId);

                    const user = await getUser(loginId);
                    console.error("DEBUG: user found:", user ? user.loginId : "null");

                    if (!user) return null;

                    const passwordsMatch = await bcrypt.compare(pin, user.pinHash);
                    console.error("DEBUG: password match:", passwordsMatch);

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
                } else {
                    console.error("DEBUG: parsing failed", parsedCredentials.error);
                }

                console.error("Invalid credentials log");
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
    // TEMPORARY: Global Auto-login as Admin
    if (!session?.user) {
        return {
            user: {
                id: "admin-bypass",
                name: "Commander",
                email: "712147333", // Maps to loginId
                image: null,
                role: "R5"
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        } as any;
    }
    return session;
};
