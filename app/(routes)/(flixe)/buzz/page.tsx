import CustomFeed from '@/components/homepage/CustomFeed'
import GeneralFeed from '@/components/homepage/GeneralFeed'
import { buttonVariants } from '@/components/ui/button'
import authOptions from "@/app/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { Home as HomeIcon } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface Session {
  user?: {
    email: string;
  };
}

export default async function Home() {
  const session: Session | null = await getServerSession(authOptions);

  return (
    <div className='sm:container max-w-7xl mx-auto h-full pt-12'>
      <h1 className='font-bold text-3xl md:text-4xl'>Your feed</h1>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-y-4 md:gap-x-4 py-6'>

        {session?.user?.email ? <CustomFeed /> : <GeneralFeed />}

        {/* subreddit info */}
        <div className='overflow-hidden h-fit rounded-lg border order-first md:order-last'>
          <div className='bg-lime-200 dark:text-card px-6 py-4'>
            <p className='font-semibold py-3 flex items-center gap-1.5'>
              <HomeIcon className='h-4 w-4' />
              Home
            </p>
          </div>
          <dl className='-my-3 divide-y divide-border px-6 py-4 text-sm leading-6'>
            <div className='flex justify-between gap-x-4 py-3'>
              <p className='text-primary/80'>
                Your personal Buzz frontpage. Come here to check in with your
                favorite communities.
              </p>
            </div>

            <Link
              className={buttonVariants({
                className: 'w-full mt-4 mb-6',
              })}
              href={`/buzz/r/create`}>
              Create Community
            </Link>
          </dl>
        </div>
      </div>
    </div>
  )
}
