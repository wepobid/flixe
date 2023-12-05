import { redirect } from "next/navigation";

import { db } from "@/lib/db";

import authOptions from "@/app/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

interface Session {
  user?: {
    email: string;
  };
}

import { Banner } from "@/components/banner";

import { TitleForm } from "./_components/title-form";
import { DescriptionForm } from "./_components/description-form";
import { ImageForm } from "./_components/image-form";
import { GenreForm } from "./_components/flix-form";
import { PriceForm } from "./_components/price-form";
import { EpisodesForm } from "./_components/episodes-form";
import { Actions } from "./_components/actions";
import { NftForm } from "./_components/nft-form";

const FlixIdPage = async ({ params }: { params: { flixId: string } }) => {
  const session: Session | null = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return redirect("/");
  }

  const flix = await db.flix.findUnique({
    where: {
      id: params.flixId,
      userId: session.user.email,
    },
    include: {
      episodes: {
        orderBy: {
          position: "asc",
        },
      },
      saleDetails: true,
    },
  });

  const genres = await db.genre.findMany({
    orderBy: {
      name: "asc",
    },
  });

  if (!flix) {
    return redirect("/");
  }

  const requiredFields = [
    flix.title,
    flix.description,
    flix.imageUrl,
    flix.genreId,
    flix.episodes.some((episode) => episode.isPublished),
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;

  const completionText = `(${completedFields} / ${totalFields})`;

  const isComplete = requiredFields.every(Boolean);

  return (
    <>
      {!flix.isPublished && (
        <Banner label="This flix is unpublished and not yet ready for public eyes!" />
      )}
      <div className="p-4 flex flex-col gap-6">
        <div className="flex items-center justify-between border rounded-md p-4">
          <div className="font-medium flex flex-col gap-4">
            <h1 className="text-3xl font-bold tracking-wider">
              Setup{" "}
              <span className="font-black text-[#8b7ad0]">{flix.title}</span>
            </h1>
            
          </div>
          <Actions
            disabled={!isComplete || !flix.isNFT}
            flixId={params.flixId}
            isPublished={flix.isPublished}
            completionText={completionText}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-x-2">
              <h2 className="text-xl font-bold">Flix Details</h2>
            </div>
            <TitleForm initialData={flix} flixId={flix.id} />
            <DescriptionForm initialData={flix} flixId={flix.id} />
            <GenreForm
              initialData={flix}
              flixId={flix.id}
              options={genres.map((genre) => ({
                label: genre.name,
                value: genre.id,
              }))}
            />
            <ImageForm initialData={flix} flixId={flix.id} />
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-x-2 font-bold">
                <h2 className="text-xl">Flix episodes</h2>
              </div>
              <EpisodesForm initialData={flix} flixId={flix.id} />
            </div>
            <div>
              <div className="flex items-center gap-x-2 font-bold">
                <h2 className="text-xl">Flix as NFT</h2>
              </div>
              <NftForm
                initialData={flix}
                flixId={flix.id}
                isComplete={isComplete}
              />
              <PriceForm initialData={flix} flixId={flix.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FlixIdPage;
