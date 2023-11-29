import { redirect } from "next/navigation";

import authOptions from "@/app/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

interface Session {
  user?: {
    email: string;
  };
}

export default async function Home() {
    const session: Session | null = await getServerSession(authOptions);

    if (!session?.user?.email) {   
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <div>
                <h1 className="text-6xl font-bold text-center">
                    Welcome To Flixe
                </h1>
            </div>
        </main>
    ); 
} else {
    return redirect("/cines");
}
}

