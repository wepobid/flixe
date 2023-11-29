// import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

import { DataTable } from "./_components/data-table";
import { columns } from "./_components/columns";

import authOptions from "@/app/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

interface Session {
    user?: {
        email: string;
    };
}

const CoursesPage = async () => {
    const session: Session | null = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
        return redirect("/");
    }

    const courses = await db.flix.findMany({
        where: {
            userId: session.user.email,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return (
        <div className="p-6">
            <DataTable columns={columns} data={courses} />
        </div>
    );
};

export default CoursesPage;
