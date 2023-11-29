import React, { useEffect, useState } from "react";
import { daysLeft } from "@/lib/daysLeft";
import Image from "next/image";
import { fetchIPFSJson } from "@/service/Web3Storage";
import BigNumber from "bignumber.js";
import { useRouter } from "next/navigation";
import Web3 from 'web3';

interface FundCardProps {
  owner: string;
  target: number;
  deadline: BigNumber;
  amountCollected: number;
  campaignURI: string;
  id: number;
}

const FundCard: React.FC<FundCardProps> = ({
  owner,
  target,
  deadline,
  amountCollected,
  campaignURI,
  id,
}) => {
  const [data, setData] = useState<{
    endDate: string;
    story: string;
    title: string;
    storyOneline: string;
    imageUrl: string;
  } | null>(null);

  const price = Web3.utils.fromWei(target, "ether");
  const remainingDays = daysLeft(Number(deadline));
  const collected = Web3.utils.fromWei(Number(amountCollected), "ether");

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchIPFSJson(campaignURI);
        setData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [campaignURI]);

  const handleCardClick = () => {
    const campaignData = {
      ...data,
      owner: owner,
      amountCollected: collected,
      remainingDays: remainingDays,
    };
    // Store your data in localStorage
    localStorage.setItem(`campaignData-${id}`, JSON.stringify(campaignData));
    // Navigate to your desired route
    router.push(`/fundz/${id}/${encodeURIComponent(data?.title || "")}`);
  };

  return data ? (
    <div
      className="group hover:shadow-sm w-full rounded-3xl bg-card cursor-pointer hover:bg-card max-w-md max-h-md"
      onClick={handleCardClick}
    >
      <div className="relative">
        <Image
          src={data ? data.imageUrl : ""}
          alt={`Selected thumbnail`}
          className={`w-full object-cover rounded-t-3xl max-h-[250px]`}
          width={150}
          height={50}
          layout="responsive"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex flex-col justify-end h-full p-5 space-y-3">
            <p className="text-muted dark:text-muted-foreground mb-2 text-xl">
              {data?.storyOneline || "Loading..."}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col p-4 space-y-4 mx-3">
        <div>
          <h3 className="text-2xl font-bold text-primary leading-6 truncate">
            {data?.title || "Loading..."}
          </h3>
        </div>

        <div className="flex justify-between items-center space-x-2">
          <div className="flex items-center">
            <h4 className="text-xl font-semibold text-[#6ca987]">
              {collected ? collected : 0} XZO
              <span className="text-md text-foreground truncate">
                <span className="text-gray-400 font-medium">
                  &nbsp;raised of&nbsp;
                </span>
                {price}
                &nbsp;XZO
              </span>
            </h4>
          </div>
          <div className="flex items-center">
            <h4 className="text-xl font-semibold text-foreground">
              {remainingDays}
              <span className="text-md text-gray-400 truncate">
                &nbsp;{remainingDays > 1 ? "Day Left" : "Days Left"}
              </span>
            </h4>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div> Data Missing </div>
  );
};

export default FundCard;
