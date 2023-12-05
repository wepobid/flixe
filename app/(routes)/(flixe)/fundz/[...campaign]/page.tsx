"use client";

import { calculateBarPercentage, daysLeft } from "@/lib/daysLeft";
import useCrowdFundingStore from "@/store/crowdFundingStore";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import CountBox from "../../../../../components/CountBox";
import { Preview } from "@/components/preview";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import DonationTable from "./donator-table";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Campaign {
  id: string;
  owner: string;
  price: string;
  endDate: Date;
  story: string;
  title: string;
  storyOneline: string;
  deadline: number;
  imageUrl: string;
  amountCollected: string;
  remainingDays: number;
}

interface DonationData {
  [0]: string[]; // Addresses
  [1]: number[]; // Donation amounts in Sun
}

const CampaignDetails = ({ params }: { params: { campaign: string[] } }) => {
  const [campaigns, setCampaigns] = useState<Campaign | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [donationData, setDonationData] = useState<DonationData>([[], []]);

  const { getCampaigns, getDonators, donateToCampaign } =
    useCrowdFundingStore();

  useEffect(() => {
    const campaignId = params.campaign[0];

    // Try to get the campaign data from localStorage first
    const storedCampaignData = localStorage.getItem(
      `campaignData-${campaignId}`
    );
    let campaignData: Campaign | null = storedCampaignData
      ? (JSON.parse(storedCampaignData) as Campaign)
      : null;

    const logDataRetrievalMethod = (method: string) =>
      console.log(`Campaign data retrieved by ${method}:`, campaignData);

    // If no data in localStorage, fetch new data
    if (!campaignData) {
      const fetchCampaigns = async () => {
        setIsLoading(true);
        try {
          const data = await getCampaigns();
          // Now you need to find the specific campaign by ID
          campaignData = data.find(
            (campaign: Campaign) => campaign.id === campaignId
          );
          if (campaignData) {
            // Update localStorage with the new data
            localStorage.setItem(
              `campaignData-${campaignId}`,
              JSON.stringify(campaignData)
            );
            setCampaigns(campaignData);
            logDataRetrievalMethod("fetchCampaigns");
          } else {
            console.error("Campaign not found");
          }
        } catch (error) {
          console.error("Couldn't fetch campaigns:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchCampaigns();
    } else {
      setCampaigns(campaignData);
      logDataRetrievalMethod("localStorage");
    }
  }, [params.campaign, getCampaigns]);

  const handleDonate = async () => {
    setIsLoading(true);

    try {
      const hash = await donateToCampaign(
        parseFloat(params.campaign[0]),
        parseFloat(amount)
      );
      console.log("hash", hash);
    } catch (error) {
      console.error("Error uploading file:", error);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    const fetchDonators = async () => {
      setIsLoading(true);
      try {
        const data = await getDonators(parseFloat(params.campaign[0]));
        setDonationData(data);
        console.log("Donators: ", data);
      } catch (error) {
        console.error("Couldn't fetch Donators:", error);
      }
      setIsLoading(false);
    };

    fetchDonators();
  }, [getDonators, params.campaign]);

  return campaigns ? (
    <div>
      {/* {isLoading && <Loader />} */}

      <Link
        href={`/fundz`}
        className="flex items-center text-sm hover:opacity-75 transition mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to fundz list view
      </Link>

      <div className="w-full flex md:flex-row flex-col mt-10 gap-[30px]">
        <div className="flex-1 flex-col">
          <div className="group relative">
            <Image
              src={campaigns ? campaigns.imageUrl : ""}
              alt="campaign"
              className="w-full max-h-[410px] object-cover rounded-xl"
              width={150}
              height={50}
              layout="responsive"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex flex-col justify-end h-full p-5 space-y-3">
                <p className="text-muted dark:text-muted-foreground mb-2 text-xl">
                  {campaigns?.storyOneline || "Loading..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex lg:flex-row flex-col gap-5 justify-between">
        <div className="flex-[2] flex flex-col gap-5">
          {/* <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-priamry uppercase">
              Creator
            </h4>

            <div className="mt-[20px] flex flex-row items-center flex-wrap gap-[14px]">
              <div className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-[#2c2f32] cursor-pointer">
                <img
                  src={thirdweb}
                  alt="user"
                  className="w-[60%] h-[60%] object-contain"
                />
              </div>
              <div>
                <h4 className="font-epilogue font-semibold text-[14px] text-priamry break-all">
                  {state.owner}
                </h4>
                <p className="mt-[4px] font-epilogue font-normal text-[12px] text-[#808191]">
                  10 Campaigns
                </p>
              </div>
            </div>
          </div> */}

          <div className="flex flex-col justify-between rounded-lg border p-4 bg-card">
            <h4 className="font-epilogue font-semibold text-[18px] text-priamry uppercase">
              Story
            </h4>

            <div className="mt-[20px]">
              <Preview value={campaigns.story} />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-lg border p-4 bg-card">
            <h4 className="font-epilogue font-semibold text-[18px] text-priamry uppercase">
              Donators
            </h4>
            <DonationTable donationData={donationData as DonationData} />
          </div>
        </div>
        <div className="flex-[1] flex flex-col gap-5">
          <div className="rounded-lg border p-4 bg-card">
            <div className="flex flex-row justify-between items-center">
              <CountBox
                title={campaigns.remainingDays > 1 ? "Days Left" : "Day Left"}
                value={campaigns.remainingDays}
              />
              <Separator orientation="vertical" />
              <CountBox
                title={`Raised of ${campaigns.price}`}
                value={campaigns.amountCollected}
              />
              <Separator orientation="vertical" />
              <CountBox title="Total Backers" value={donationData[0].length} />
            </div>
            <div className="relative w-full h-[5px] bg-[#3a3a43] mt-2">
              <div
                className="absolute h-full bg-[#4acd8d] rounded"
                style={{
                  width: `${calculateBarPercentage(
                    parseFloat(campaigns.price),
                    parseFloat(campaigns.amountCollected)
                  )}%`,
                  maxWidth: "100%",
                }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col gap-4 justify-between rounded-lg border p-4 bg-card">
            <h4 className="font-epilogue font-semibold text-[18px] text-priamry uppercase">
              Fuel the Flix Campaign
            </h4>
            
            <div className="flex gap-4 border border-emerald-500/20 bg-emerald-50/50 p-4 leading-6 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/5 dark:text-emerald-200 rounded-[10px]">
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className="mt-1 h-4 w-4 flex-none fill-emerald-500 stroke-priamry dark:fill-emerald-200/20 dark:stroke-emerald-200"
              >
                <circle cx="8" cy="8" r="8" stroke-width="0"></circle>
                <path
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M6.75 7.75h1.5v3.5"
                ></path>
                <circle cx="8" cy="4" r=".5" fill="none"></circle>
              </svg>
              <p className="font-epilogue text-[16px]">
                Your belief can bring this story to the screen. Contribute to
                our journey and be a part of an Art that resonates.
              </p>
            </div>

            <div className="flex flex-row items-center">
              <div className="flex flex-row items-center w-2/3 ">
                <input
                  type="text"
                  pattern="^(?:[1-9]\d*|0)?(?:\.\d+)?$"
                  placeholder="0.0001"
                  value={amount}
                  className="pl-3 font-semibold text-[#6ca987] text-lg bg-background rounded-l-[10px] border p-2 focus:outline-none focus:ring-2 focus:ring-card"
                  onChange={(e) => {
                    const validDecimalOrDot = /^(?:[1-9]\d*|0)?(?:\.\d*)?$/;
                    if (
                      e.target.value === "" ||
                      validDecimalOrDot.test(e.target.value)
                    ) {
                      setAmount(e.target.value);
                    }
                  }}
                />
                <span className="bg-muted/50 hover:bg-muted rounded-r-[10px] border p-2">
                  XZO
                </span>
              </div>

              <Button
                className="text-primary font-black py-2 px-4 rounded-[10px] hover:text-[#6ca987] bg-muted/50 hover:bg-muted w-1/3"
                onClick={handleDonate}
              >
                Support the Vision
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <h1> Campaign details misisng </h1>
  );
};

export default CampaignDetails;
