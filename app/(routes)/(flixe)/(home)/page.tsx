import { redirect } from "next/navigation";

import authOptions from "@/app/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { ScrollCore } from "./components/scroll";
import Image from "next/image";
import { WalletConnection } from "@/components/wallet-connection";
import { BackgroundSVG } from './components/backgroundBeam';
import { MeteorPreview } from './components/meteorPreview';
import { Meteors } from './components/meteors';
import { Lamp } from './components/SVGMaskEffect';

interface Session {
  user?: {
    email: string;
  };
}

export default async function Home() {
  const session: Session | null = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-16">
        <div className="flex flex-col gap-4 justify-center z-10">
          <h1 className="text-5xl md:text-6xl lg:text-9xl font-bold text-center leading-tight tracking-tighter my-4">
            Step into{" "}
            <span className="flixe-gradient text-5xl md:text-6xl lg:text-9xl font-black px-1">
              Flixe
            </span>{" "}
            <span className="font-extrabold inline-block align-middle">
              <Image
                src="/logo.png"
                alt="Flixe logo"
                width={110}
                height={110}
                className="pb-6"
              />
            </span>{" "}
            Universe
          </h1>

          <div className="text-center font-semibold text-xl">
            Unlock the magic with <WalletConnection home={true} /> to explore
            further!
          </div>
          <ScrollCore />
        </div>
        <BackgroundSVG />
        {/* <Meteors number={10} /> */}
        {/* <MeteorPreview /> */}
        {/* <Lamp /> */}
        
      </main>
    );
  } else {
    return redirect("/cines");
  }
}
