import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import authOptions from "@/app/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

interface Session {
  user?: {
    email: string;
  };
}

type Episode = {
  id: string;
  title: string;
  imageUrl: string | null;
  shortdescription: string | null;
  description: string | null;
  videoUrl: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  flixId: string;
  completeEpisodeData: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
};

type FlixData = {
  id?: string;
  title?: string;
  imageUrl?: string | null;
  shortdescription?: string | null;
  description?: string | null;
  videoUrl?: string | null;
  position?: number;
  flixId?: string;
  completeData?: Prisma.JsonValue | null;
  episodes?: {
    id?: string;
    title?: string;
    imageUrl?: string | null;
    shortdescription?: string | null;
    description?: string | null;
    videoUrl?: string | null;
    position?: number;
    flixId?: string;
    createdAt?: Date;
  }[];
};

function isFlixData(data: any): data is FlixData {
  return (
    data &&
    typeof data.id === "string" &&
    Array.isArray(data.episodes) &&
    typeof data.title === "string"
  );
}

export async function DELETE(
  req: Request,
  { params }: { params: { flixId: string } }
) {
  try {
    const session: Session | null = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const flix = await db.flix.findUnique({
      where: {
        id: params.flixId,
        userId: session.user.email,
      },
      include: {
        episodes: {
          include: {
            videoData: true,
          },
        },
      },
    });

    if (!flix) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletedFlix = await db.flix.delete({
      where: {
        id: params.flixId,
      },
    });

    return NextResponse.json(deletedFlix);
  } catch (error) {
    console.log("[COURSE_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

async function populateCompleteData(flixId: string) {
  try {
    const flix = await db.flix.findUnique({
      where: { id: flixId },
      include: {
        episodes: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            shortdescription: true,
            description: true,
            videoUrl: true,
            position: true,
            flixId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!flix) throw new Error(`Flix with id ${flixId} not found.`);

    // Exclude fields for Flix table
    const flixData = {
      ...flix,
      userId: undefined,
      price: undefined,
      discountPercentage: undefined,
      isPublished: undefined,
      saleStatus: undefined,
      updatedAt: undefined,
      flixDataUrl: undefined,
      completeData: undefined,
    };

    for (const episode of flix.episodes) {
      // Exclude fields for Episode table
      const episodeData = {
        ...episode,
        isPublished: undefined,
        isFree: undefined,
        updatedAt: undefined,
        completeEpisodeData: undefined,
      };

      await db.episode.update({
        where: { id: episode.id },
        data: {
          completeEpisodeData: JSON.stringify(episodeData),
        },
      });
    }

    await db.flix.update({
      where: { id: flixId },
      data: {
        completeData: JSON.stringify(flixData),
      },
    });

    return flixData;
  } catch (error) {
    console.error("Error in populateCompleteData:", error);
    throw error;
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { flixId: string } }
) {
  try {
    const session: Session | null = await getServerSession(authOptions);
    const { flixId } = params;
    const values = await req.json();

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const existingFlix = await db.flix.findUnique({
      where: {
        id: flixId,
        userId: session.user.email,
      },
      include: {
        saleDetails: true,
        episodes: true,
      },
    });

    if (!existingFlix) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (
      values.saleStatus === "AUCTION" &&
      (!values.saleDetails ||
        values.saleDetails.timeLeft === undefined ||
        values.saleDetails.timeLeft === null ||
        values.saleDetails.timeLeft < 0)
    ) {
      return new NextResponse(
        "Auction start date should be today or in the future.",
        { status: 400 }
      );
    }

    if (existingFlix.isNFT) {
      const prohibitedFlixFields: (keyof typeof existingFlix)[] = [
        "title",
        "description",
        "imageUrl",
        "quicks",
        "shorts",
        "categoryId",
        "episodes",
        "completeData",
        "flixDataUrl",
        "isNFT",
        "createdAt",
      ];

      for (const field of prohibitedFlixFields) {
        if (values[field] && existingFlix[field] !== values[field]) {
          return new NextResponse(
            `Modification of field '${field}' is not allowed when isNFT is true.`,
            { status: 400 }
          );
        }
      }

      if (values.episodes) {
        const prohibitedEpisodeFields: (keyof Episode)[] = [
          "title",
          "imageUrl",
          "shortdescription",
          "description",
          "videoUrl",
          "position",
          "flixId",
          "createdAt",
        ];

        for (const episode of values.episodes) {
          const existingEpisode = existingFlix.episodes.find(
            (e) => e.id === episode.id
          );
          for (const field of prohibitedEpisodeFields) {
            if (
              episode[field] &&
              existingEpisode &&
              existingEpisode[field as keyof typeof existingEpisode] !==
                episode[field]
            ) {
              return new NextResponse(
                `Modification of episode field '${field}' is not allowed when isNFT is true.`,
                { status: 400 }
              );
            }
          }
        }
      }
    }

    if (values.saleStatus !== "STREAM") {
      if (existingFlix.saleDetails) {
        await db.saleDetails.update({
          where: { id: existingFlix.saleDetails.id },
          data: {
            timeLeft: values.saleDetails?.timeLeft || undefined,
            endTime: values.saleDetails?.endTime || undefined,
            price: values.price || undefined,
            discountPercentage: values.discountPercentage || undefined,
          },
        });
      } else {
        await db.saleDetails.create({
          data: {
            timeLeft: values.saleDetails?.timeLeft || undefined,
            endTime: values.saleDetails?.endTime || undefined,
            price: values.price || undefined,
            discountPercentage: values.discountPercentage || undefined,
            flix: { connect: { id: flixId } },
          },
        });
      }
    } else if (existingFlix.saleDetails) {
      await db.saleDetails.delete({
        where: { id: existingFlix.saleDetails.id },
      });
    }

    let flixData: FlixData | "NO_DATA" = "NO_DATA";

    if (!existingFlix.isNFT && values.NFTDATA) {
      if (!existingFlix.completeData) {
        flixData = await populateCompleteData(flixId);
      } else {
        if (isFlixData(existingFlix.completeData)) {
          flixData = existingFlix.completeData;
        }
      }

      return NextResponse.json({ flixData }, { status: 200 });
    }

    if (!values.NFTDATA) {
      const updateData: any = {};

      // if (values.isNFT !== undefined && values.isNFT) updateData.isNFT = values.isNFT;
      // if (values.flixNftId !== undefined) updateData.flixNftId = values.flixNftId;
      // if (values.flixDataUrl !== undefined)
      //   updateData.flixDataUrl = values.flixDataUrl;
      // if (values.saleStatus !== undefined)
      //   updateData.saleStatus = values.saleStatus;
      // if (values.price !== undefined) updateData.price = values.price;
      // if (values.discountPercentage !== undefined) updateData.discountPercentage = values.discountPercentage;

      for (const key in values) {
        if (values.hasOwnProperty(key)) {
          // Check if the key is not 'saleDetails' and the value is not undefined
          if (
            key !== "saleDetails" &&
            values[key] !== undefined &&
            ((key === "isNFT" && values.isNFT) || key !== "isNFT")
          ) {
            updateData[key] = values[key];
          }
        }
      }

      const updatedFlix = await db.flix.update({
        where: {
          id: flixId,
          userId: session.user.email,
        },
        data: updateData,
      });

      return NextResponse.json(updatedFlix);
    }
  } catch (error) {
    console.log("[COURSE_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
