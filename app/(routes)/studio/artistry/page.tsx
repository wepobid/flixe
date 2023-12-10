"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchAddress } from "@/lib/walletUtil";
import { useRouter } from "next/navigation";

const CreateCampaign = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const updateWalletAddress = async () => {
    const address = await fetchAddress();
    setWalletAddress(address);
  };

  useEffect(() => {
    updateWalletAddress();
  }, []);

  const router = useRouter();

  const handleClick = () => {
    router.push("/studio/artistry/create");
  };

  return (
    <div className="p-6">
      {/* {isLoading && <Loader />} */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-2">
          <h1 className="text-3xl font-bold tracking-wider">Artistry List</h1>
          {/* <span className="text-sm text-primary">Complete all fields</span> */}
        </div>
        <div className="flex items-center gap-x-8">
          <Button onClick={handleClick}>Create</Button>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;
