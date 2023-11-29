import prisma from "@/lib/prisma/prismadb";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { ethers } from "ethers";
import NextAuth, { AuthOptions, RequestInternal, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export type WalletSession = Session & {
    user: {
        id: string;
        walletAddress: string;
        name?: string | null;
    };
};

async function authorizeCrypto(
    credentials: Record<"walletAddress" | "signedNonce", string> | undefined,
    req: Pick<RequestInternal, "body" | "headers" | "method" | "query">
) {
    if (!credentials) return null;
    const { walletAddress, signedNonce } = credentials;
    const user = await prisma.user.findUnique({
        where: { walletAddress },
        include: { loginNonce: true },
    });
    if (!user?.loginNonce) return null;
    let signerValidation;
    try {
        signerValidation = ethers.utils.verifyMessage(
            user.loginNonce.nonce,
            signedNonce
        );
    } catch (error) {
        console.error("Error verifying message:", error);
        return null;
    }
    if (!signerValidation) return null;
    if (user.loginNonce.expires < new Date()) return null;
    await prisma.loginNonce.delete({ where: { userId: user.id } });
    user["email"] = walletAddress;
    return user;
}

const handler = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            id: "crypto",
            name: "Crypto Wallet Auth",
            credentials: {
                walletAddress: { label: "Wallet Address", type: "text" },
                signedNonce: { label: "signed Nonce", type: "text" },
            },
            authorize: authorizeCrypto,
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async session({ session }) {
            return session;
        },
        async jwt({ token }) {
            return token;
        },
        async signIn() {
            return true;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
