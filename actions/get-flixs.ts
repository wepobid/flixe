import { Category, Flix } from "@prisma/client";

import { getProgress } from "@/actions/get-progress";
import { db } from "@/lib/db";

type FlixWithProgressWithCategory = Flix & {
  category: Category | null;
  episodes: { id: string }[];
  // progress: number | null;
};

type GetFlixs = {
  userId: string;
  title?: string;
  categoryId?: string;
};

export const getFlixs = async ({
  userId,
  title,
  categoryId
}: GetFlixs): Promise<FlixWithProgressWithCategory[]> => {
  try {
    const flixs = await db.flix.findMany({
      where: {
        isPublished: true,
        title: {
          contains: title,
        },
        categoryId,
      },
      include: {
        category: true,
        episodes: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          }
        },
        // purchases: {
        //   where: {
        //     userId,
        //   }
        // }
      },
      orderBy: {
        createdAt: "desc",
      }
    });

    // const flixsWithProgress: FlixWithProgressWithCategory[] = await Promise.all(
    //   flixs.map(async flix => {
    //     if (flix.purchases.length === 0) {
    //       return {
    //         ...flix,
    //         progress: null,
    //       }
    //     }

    //     const progressPercentage = await getProgress(userId, flix.id);

    //     return {
    //       ...flix,
    //       progress: progressPercentage,
    //     };
    //   })
    // );

    // return flixsWithProgress; 
    
    return flixs;
  } catch (error) {
    console.log("[GET_COURSES]", error);
    return [];
  }
}