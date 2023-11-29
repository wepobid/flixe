import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { SearchInput } from "@/components/search-input";
import { getFlixs } from "@/actions/get-flixs";
import { FlixsList } from "@/components/flixs-list";

import { Categories } from "./_components/categories";

import authOptions from "@/app/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import Carousel from "./_components/carousel";

interface Session {
  user?: {
    email: string;
  };
}

interface SearchPageProps {
  searchParams: {
    title: string;
    categoryId: string;
  };
}

const SearchPage = async ({ searchParams }: SearchPageProps) => {
  const session: Session | null = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return redirect("/");
  }

  const categories = await db.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const userId = session?.user?.email;

  const flixs = await getFlixs({
    userId,
    ...searchParams,
  });

  return (
    <>
      <div className="px-6 pt-6 md:hidden md:mb-0 block"></div>
      <Carousel />
      <div className="p-4 space-y-4">
        <div className="flex flex-row gap-x-5 justify-center items-center">
          <SearchInput />
          <Categories items={categories} />
        </div>
        <FlixsList items={flixs} />
      </div>
    </>
  );
};

export default SearchPage;
