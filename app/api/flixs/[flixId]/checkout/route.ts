import { NextResponse } from "next/server";

import { db } from "@/lib/db";

import authOptions from "@/app/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

interface Session {
    user?: {
        email: string;
    };
}

const contractAddress = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS;

export async function POST(
    req: Request,
    { params }: { params: { flixId: string } }
) {
    const { flixId } = params;

    try {
        const session: Session | null = await getServerSession(authOptions);

        const values = await req.json();

        if (
            !session?.user?.email ||
            (values.userId !== session.user.email &&
                values.userId !== contractAddress)
        ) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (
            values.userId !== session.user.email &&
            values.userId === contractAddress
        ) {
            values.userId = session.user.email;
        }

        const flix = await db.flix.findUnique({
            where: {
                id: params.flixId,
                isPublished: true,
            },
            include: {
                saleDetails: true,
                episodes: true,
            },
        });

        if (!flix) {
            return new NextResponse("Not found", { status: 404 });
        }

        if (flix?.userId === session.user.email) {
            return new NextResponse("Already purchased", { status: 400 });
        }

        if (flix.saleDetails) {
            await db.saleDetails.delete({
                where: { id: flix.saleDetails.id },
            });
        }

        const updatedFlix = await db.flix.update({
            where: {
                id: flixId,
                isPublished: true,
            },
            data: values,
        });

        return NextResponse.json(updatedFlix);
    } catch (error) {
        console.log("[FLIX_ID_CHECKOUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
