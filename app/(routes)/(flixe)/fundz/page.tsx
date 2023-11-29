"use client";

import React, { useEffect, useState } from "react";
import DisplayCampaigns from "@/components/DisplayCampaigns";
import useCrowdFundingStore from "@/store/crowdFundingStore";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

interface Campaign {
  id: number;
  name: string;
}

const FullScreenImage: React.FC = () => {
  const { getCampaigns } = useCrowdFundingStore();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true);
      try {
        const data = await getCampaigns();
        setCampaigns(data);
        console.log(data);
      } catch (error) {
        console.error("Couldn't fetch campaigns:", error);
      }
      setIsLoading(false);
    };

    fetchCampaigns();
  }, [getCampaigns]);

  return (
    <div className="flex flex-col gap-10">
      <Link href="/fundz/create">
        <Button className="font-bold">
          <PlusCircle className="h-4 w-4 mr-2 font-bold" />
          New Campaign
        </Button>
      </Link>
      <DisplayCampaigns
        title="All Campaigns"
        isLoading={isLoading}
        campaigns={campaigns}
      />
    </div>
  );
};

export default FullScreenImage;
