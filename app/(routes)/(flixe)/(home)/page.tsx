import { redirect } from "next/navigation";

import authOptions from "@/app/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { ScrollCore } from "./components/scroll";
import Image from "next/image";
import MagicComponent from "./components/metamask";

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
        <div className="flex flex-col gap-4 justify-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-center leading-tight tracking-tighter my-4">
            Step into{" "}
            <span className="animated-gradient text-5xl md:text-6xl lg:text-7xl font-black px-1">
              Flixe
            </span>{" "}
            <span className="font-extrabold inline-block align-middle">
              <Image
                src="/flixe.svg"
                alt="Flixe logo"
                width={70}
                height={70}
                className="pb-2"
              />
            </span>{" "}
            Universe
          </h1>

          <div className="text-center font-semibold text-xl">
            Unlock the magic with{" "}
            <span className="animated-gradient text-2xl font-black px-1">
              Metamask
            </span>{" "}
            to explore further!
          </div>
          <MagicComponent />
          <ScrollCore />
        </div>
      </main>
    );
  } else {
    return redirect("/cines");
  }
}
