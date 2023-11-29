"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Info, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flix, Prisma } from "@prisma/client";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import MarketplaceInteraction from "@/contracts/MarketplaceInteraction";
import { DateTimePicker } from "@/components/ui/date-time-picker/date-time-picker";
import getTimeDifferenceInSec from "@/lib/getTimeDifferenceInSec";

const DISCOUNT_INTERVAL = 1800;

interface SaleDetailsFromDB {
  id: string;
  price: number | null;
  bottomPrice: number | null;
  discountPercentage: number | null;
  currentBid: number | null;
  timeLeft: number | null;
  endTime: Prisma.JsonValue | null;
  flixId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FlixWithSaleDetails extends Flix {
  saleDetails?: SaleDetailsFromDB | null;
}

interface PriceFormProps {
  initialData: FlixWithSaleDetails;
  flixId: string;
}

const jsonString = z.string().refine(
  (value) => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },
  {
    message: "Invalid JSON string",
  }
);

const formSchema = z
  .object({
    isNFT: z.boolean(),
    saleStatus: z.enum(["STREAM", "AUCTION", "SALE", "RENT"]),
    price: z
      .string()
      .refine(
        (value) => !isNaN(parseFloat(value)) && parseFloat(value) >= 0.0001,
        {
          message: "Price should be more than 0.0001",
          path: ["price"],
        }
      ),
    saleDetails: z.object({
      bottomPrice: z
        .string()
        .refine(
          (value) => !isNaN(parseFloat(value)) && parseFloat(value) >= 0.0001,
          {
            message: "Bottom Price should be more than 0.0001",
            path: ["bottomPrice"],
          }
        )
        .optional(),
      timeLeft: z.number().optional(),
      endTime: jsonString.optional(),
    }),
    discountPercentage: z
      .string()
      .optional()
      .refine(
        (value) =>
          value === undefined ||
          (!isNaN(parseFloat(value)) && parseFloat(value) >= 0),
        {
          message: "Discount Percentage should be 0 or more",
          path: ["discountPercentage"],
        }
      ),
  })
  .refine(
    (data) => {
      if (data.saleStatus === "AUCTION") {
        const price = parseFloat(data.price);
        const bottomPrice = data.saleDetails.bottomPrice
          ? parseFloat(data.saleDetails.bottomPrice)
          : undefined;
        const discountPercentage = data.discountPercentage
          ? parseFloat(data.discountPercentage)
          : undefined;

        // Check if bottomPrice is defined before proceeding with the calculation
        if (bottomPrice !== undefined) {
          if (price <= bottomPrice) {
            return false;
          }
          if (discountPercentage !== undefined) {
            const maxDiscountAllowed = ((price - bottomPrice) / price) * 100;
            if (discountPercentage > maxDiscountAllowed) {
              return false;
            }
          }
        } else {
          // If bottomPrice is not defined, ensure discountPercentage is not defined or zero
          if (discountPercentage !== undefined && discountPercentage > 0) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message:
        "When the sale status is 'AUCTION', the Bottom Price must be less than the Starting Price, and the Discount Percentage must not reduce the price below the Bottom Price in one interval.",
      path: ["saleStatus"],
    }
  );

export const PriceForm = ({ initialData, flixId }: PriceFormProps) => {
  const { toast } = useToast();
  console.log("Initial Data:", initialData);

  const nftMarketplace = MarketplaceInteraction();

  const [isEditing, setIsEditing] = useState(false);

  const [selectedDateTime, setSelectedDateTime] = useState<any | null>(null);

  const [maxDiscount, setMaxDiscount] = useState<number | null>(null);

  const [dynamicContent, setDynamicContent] = useState<string | null>(null);

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isNFT: initialData?.isNFT || undefined,
      saleStatus: initialData?.saleStatus || "STREAM",
      price: initialData?.price ? initialData.price.toString() : undefined,
      discountPercentage: initialData?.discountPercentage
        ? initialData.discountPercentage.toString()
        : undefined,
      saleDetails: {
        bottomPrice: initialData?.saleDetails?.bottomPrice
          ? initialData.saleDetails?.bottomPrice.toString()
          : undefined,
        timeLeft: initialData?.saleDetails?.timeLeft
          ? initialData?.saleDetails?.timeLeft
          : 0,
        endTime: initialData?.saleDetails?.endTime
          ? JSON.stringify(initialData?.saleDetails?.endTime)
          : undefined,
      },
    },
  });

  const { isSubmitting, isValid, errors } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    let payload;

    // STREAM
    if (values.saleStatus === "STREAM") {
      payload = {
        ...values,
        price: null,
        discountPercentage: null,
        saleDetails: null,
      };

      try {
        if (
          initialData.flixNftId !== null &&
          initialData.flixNftId !== undefined &&
          initialData.saleStatus !== "STREAM"
        ) {
          if (initialData.saleStatus === "SALE") {
            await nftMarketplace.unlistNFT(initialData.flixNftId);
          } else if (initialData.saleStatus === "AUCTION") {
            await nftMarketplace.cancelNFTAuction(initialData.flixNftId);
          } else if (initialData.saleStatus === "RENT") {
            await nftMarketplace.cancelNFTAuction(initialData.flixNftId);
          }
          toast({
            title: "Flix NFT removed from sale",
            description: "Successfully removed Flix NFT from sale.",
          });
        } else {
          throw new Error("flixNftId is not defined, null, or empty.");
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Uh oh! Failed to remove nft from Sale.",
          description: error.message || "Failed to remove nft from Sale.",
        });
        throw new Error("Failed to remove from sale");
      }
    }

    // RENT
    if (values.saleStatus === "RENT" && initialData.saleStatus === "STREAM") {
      payload = {
        ...values,
        price: parseFloat(values.price),
        discountPercentage: null,
        saleDetails: {
          timeLeft: null,
          endTime: null,
          price: parseFloat(values.price),
          bottomPrice: null,
          discountPercentage: null,
        },
      };

      try {
        if (
          initialData.flixNftId !== null &&
          initialData.flixNftId !== undefined &&
          initialData.saleStatus === "STREAM"
        ) {
          await nftMarketplace.listNFTForRent(
            initialData.flixNftId,
            parseFloat(values.price)
          );
          toast({
            title: "Flix NFT for RENT",
            description: "Successfully listed this Flix NFT for RENT.",
          });
        } else {
          throw new Error("flixNftId is not defined, null, or empty.");
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Uh oh! Failed to put nft for RENT.",
          description: error.message || "Failed to put nft for RENT.",
        });
        throw new Error("Failed to put nft for RENT");
      }
    }

    // FIXED SALE
    if (values.saleStatus === "SALE" && initialData.saleStatus === "STREAM") {
      payload = {
        ...values,
        price: parseFloat(values.price),
        discountPercentage: null,
        saleDetails: {
          timeLeft: null,
          endTime: null,
          price: parseFloat(values.price),
          bottomPrice: null,
          discountPercentage: null,
        },
      };

      try {
        if (
          initialData.flixNftId !== null &&
          initialData.flixNftId !== undefined &&
          initialData.saleStatus === "STREAM"
        ) {
          await nftMarketplace.listNFTForSale(
            initialData.flixNftId,
            parseFloat(values.price)
          );
          toast({
            title: "Flix NFT on Fixed Sale",
            description: "Successfully listed this Flix NFT on Fixed Sale.",
          });
        } else {
          throw new Error("flixNftId is not defined, null, or empty.");
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Uh oh! Failed to put nft on fixed Sale.",
          description: error.message || "Failed to put nft on fixed Sale.",
        });
        throw new Error("Failed to put nft on fixed Sale");
      }
    }

    // AUCTION
    if (
      values.saleStatus === "AUCTION" &&
      initialData.saleStatus === "STREAM" &&
      values.discountPercentage
    ) {
      payload = {
        ...values,
        price: parseFloat(values.price),
        discountPercentage: parseFloat(values.discountPercentage),
        saleDetails: {
          timeLeft: getTimeDifferenceInSec(selectedDateTime),
          endTime: selectedDateTime,
          price: parseFloat(values.price),
          bottomPrice: parseFloat(values.saleDetails.bottomPrice || "0"),
          discountPercentage: parseFloat(values.discountPercentage),
        },
      };

      try {
        if (
          initialData.flixNftId !== null &&
          initialData.flixNftId !== undefined &&
          initialData.saleStatus === "STREAM" &&
          getTimeDifferenceInSec(selectedDateTime) > 0
        ) {
          const discountAmount =
            parseFloat(values.price) *
            (parseFloat(values.discountPercentage) / 100);

          // alert(discountAmount)

          if (discountAmount < 0)
            throw new Error("discountAmount is less than 0.");

          if (
            typeof initialData.flixNftId === "number" &&
            typeof values.price === "string" &&
            typeof values.saleDetails.bottomPrice === "string"
          ) {
            await nftMarketplace.startNFTAuction(
              initialData.flixNftId,
              parseFloat(values.price),
              parseFloat(values.saleDetails.bottomPrice),
              discountAmount,
              getTimeDifferenceInSec(selectedDateTime)
            );

            toast({
              title: "Flix NFT on Fixed Sale",
              description: "Successfully listed this Flix NFT on Fixed Sale.",
            });
          } else {
            console.error(
              "Invalid input: expected number values for flixNftId, price, and bottomPrice"
            );
            throw new Error(
              "Invalid input: expected number values for flixNftId, price, and bottomPrice"
            );
          }
        } else {
          throw new Error("flixNftId is not defined, null, or empty.");
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Uh oh! Failed to put nft on auction Sale.",
          description: error.message || "Failed to put nft on auction Sale.",
        });
        throw new Error("Failed to put nft on auction Sale");
      }
    }

    try {
      await axios.patch(`/api/flixs/${flixId}`, payload);
      toast({
        title: "Flix updated",
        description: "The flix has been successfully updated.",
      });
      toggleEdit();
      router.refresh();
    } catch (error) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      });
    }
  };

  useEffect(() => {
    const currentPrice = parseFloat(form.getValues().price || "0");
    const bottomPrice = parseFloat(
      form.getValues().saleDetails.bottomPrice || "0"
    );

    if (currentPrice && selectedDateTime && bottomPrice < currentPrice) {
      const auctionDuration = getTimeDifferenceInSec(selectedDateTime);
      const maxAllowedDiscount =
        ((currentPrice - bottomPrice) / currentPrice) * 100;
      const maxDiscountPerInterval =
        maxAllowedDiscount / (auctionDuration / DISCOUNT_INTERVAL);
      setMaxDiscount(Number(maxDiscountPerInterval.toFixed(3)));
    } else {
      setMaxDiscount(null);
    }
  }, [
    form.getValues().price,
    selectedDateTime,
    form.getValues().saleDetails.bottomPrice,
  ]);

  useEffect(() => {
    if (form.watch("saleStatus") === "AUCTION") {
      const currentPrice = parseFloat(form.getValues().price || "0");
      const discountPercent = parseFloat(
        form.watch("discountPercentage") || "0"
      );
      const discountValue = (currentPrice * discountPercent) / 100;
      const effectiveDiscount = Math.max(discountValue, 0);

      if (currentPrice && discountPercent && selectedDateTime) {
        setDynamicContent(
          `For every 30 mins until auction's end, the price drops by ${discountPercent}% i.e roughly ${effectiveDiscount}`
        );
      } else if (initialData.saleStatus !== "AUCTION") {
        setDynamicContent(
          "Set the valid price and auction duration to put this Flix on NFT Auction."
        );
      }
    } else if (form.watch("saleStatus") === "STREAM") {
      setDynamicContent(
        "Offers complimentary access to free episodes and exclusive premium content as part of a Premium Membership."
      );
    } else if (form.watch("saleStatus") === "RENT") {
      setDynamicContent(
        "Offers complimentary access to free episodes and allows you to Rent exclusive premium content"
      );
    } else {
      setDynamicContent(
        "Set the valid price to put this Flix on Fixed NFT Sale."
      );
    }
  }, [
    form.getValues().price,
    form.watch("discountPercentage"),
    selectedDateTime,
    form.watch("saleStatus"),
  ]);

  return (
    <div className="mt-6 border bg-background rounded-md p-4">
      <div className="flex items-center justify-between font-semibold text-lg">
        Flix Sales status
        <Button
          onClick={toggleEdit}
          variant="ghost"
          disabled={!initialData.isNFT}
        >
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit price
            </>
          )}
        </Button>
      </div>

      {!isEditing && (
        <p
          className={cn(
            "text-sm mt-2",
            !initialData.price && "text-slate-500 italic"
          )}
        >
          {initialData.price ? (
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold p-1">{initialData.price}</h3>
              <h2 className="text-base font-bold text-gray-600">XZO</h2>
            </div>
          ) : (
            "No price"
          )}
        </p>
      )}

      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            {/* Set the Flix NFT Sales Status */}
            <FormField
              control={form.control}
              name="saleStatus"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-card">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Set Flix Sales status
                    </FormLabel>
                    <FormDescription>
                      Select the sales status of the Flix NFT
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange({
                          target: {
                            name: field.name,
                            value: value,
                          },
                        });
                      }}
                      disabled={!initialData.isNFT}
                      defaultValue="STREAM"
                    >
                      <SelectTrigger className="ml-auto w-auto gap-2 font-bold">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STREAM">STREAM</SelectItem>
                        <SelectItem
                          value="RENT"
                          disabled={
                            initialData.saleStatus === "AUCTION" ||
                            initialData.saleStatus === "SALE"
                          }
                        >
                          RENT
                        </SelectItem>

                        <SelectItem
                          value="AUCTION"
                          disabled={
                            initialData.saleStatus === "SALE" ||
                            initialData.saleStatus === "RENT"
                          }
                        >
                          AUCTION
                        </SelectItem>
                        <SelectItem
                          value="SALE"
                          disabled={
                            initialData.saleStatus === "AUCTION" ||
                            initialData.saleStatus === "RENT"
                          }
                        >
                          SALE
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("saleStatus") !== "STREAM" && (
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  {form.watch("saleStatus") !== "STREAM" && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem className="flex flex-row gap-3 items-center justify-between rounded-lg border p-4 bg-card w-1/2">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {form.watch("saleStatus") !== "RENT"
                                ? "Starting Price"
                                : "Per Day Rent"}
                            </FormLabel>
                            <FormDescription className="whitespace-nowrap">
                              {form.watch("saleStatus") === "AUCTION"
                                ? "Set Starting bit"
                                : "Set the NFT Flix price"}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Input
                              type="text"
                              pattern="^(?:[1-9]\d*|0)?(?:\.\d+)?$"
                              disabled={
                                isSubmitting ||
                                initialData.saleStatus !== "STREAM"
                              }
                              placeholder="Price"
                              value={
                                field.value == null
                                  ? "0"
                                  : field.value.toString()
                              }
                              className="max-w-[40%]"
                              onChange={(e) => {
                                const validDecimalOrDot =
                                  /^(?:[1-9]\d*|0)?(?:\.\d*)?$/;
                                if (
                                  e.target.value === "" ||
                                  validDecimalOrDot.test(e.target.value)
                                ) {
                                  field.onChange(e.target.value);
                                }
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("saleStatus") === "AUCTION" && (
                    <FormField
                      control={form.control}
                      name="saleDetails.bottomPrice"
                      render={({ field }) => (
                        <FormItem className="flex flex-row gap-3 items-center justify-between rounded-lg border p-4 bg-card w-1/2">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Bottom Price
                            </FormLabel>
                            <FormDescription className="whitespace-nowrap">
                              {form.watch("saleStatus") === "AUCTION"
                                ? "Set the Bottom Price"
                                : "Set the NFT Flix price"}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Input
                              type="text"
                              pattern="^(?:[1-9]\d*|0)?(?:\.\d+)?$"
                              disabled={
                                isSubmitting ||
                                initialData.saleStatus !== "STREAM"
                              }
                              placeholder="Price"
                              value={
                                field.value == null
                                  ? "0"
                                  : field.value.toString()
                              }
                              className="max-w-[40%]"
                              onChange={(e) => {
                                const validDecimalOrDot =
                                  /^(?:[1-9]\d*|0)?(?:\.\d*)?$/;
                                if (
                                  e.target.value === "" ||
                                  validDecimalOrDot.test(e.target.value)
                                ) {
                                  field.onChange(e.target.value);
                                }
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {form.watch("saleStatus") === "AUCTION" && (
                  <div className="flex gap-4">
                    <div className="flex flex-row gap-3 items-center justify-between rounded-lg border p-4 bg-card w-1/2">
                      <div className="space-y-0.5">
                        <FormLabel htmlFor="date" className="text-base">
                          Action end time
                        </FormLabel>
                        <FormDescription className="whitespace-nowrap">
                          Set Auction end time
                        </FormDescription>
                      </div>
                      <DateTimePicker
                        className="[&>button]:w-full"
                        value={selectedDateTime}
                        onChange={setSelectedDateTime}
                        granularity="minute"
                        isDisabled={initialData.saleStatus !== "STREAM"}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="discountPercentage"
                      render={({ field }) => (
                        <FormItem className="flex flex-row gap-3 items-center justify-between rounded-lg border p-4 bg-card w-1/2">
                          <div className="space-y-0.5">
                            <FormLabel
                              htmlFor="discountPercentage"
                              className="text-base"
                            >
                              Discount %
                            </FormLabel>
                            {maxDiscount && maxDiscount >= 0 ? (
                              <FormDescription className="whitespace-nowrap">
                                Set value less than :{" "}
                                <b className="text-base">{maxDiscount} %</b>
                              </FormDescription>
                            ) : (
                              <FormDescription className="whitespace-nowrap">
                                Set valid price and duration first
                              </FormDescription>
                            )}
                          </div>
                          <FormControl>
                            <Input
                              type="text"
                              pattern="^(?:[1-9]\d*|0)?(?:\.\d*)?$"
                              min="0"
                              max={maxDiscount?.toString() || "0"}
                              placeholder="Discount %"
                              disabled={
                                isSubmitting ||
                                initialData.saleStatus !== "STREAM" ||
                                !(maxDiscount && maxDiscount >= 0)
                              }
                              value={
                                field.value == null
                                  ? "0"
                                  : field.value.toString()
                              }
                              className="max-w-[40%]"
                              onChange={(e) => {
                                const validDecimalOrDot =
                                  /^(?:[1-9]\d*|0)?(?:\.\d*)?$/;
                                if (
                                  e.target.value === "" ||
                                  validDecimalOrDot.test(e.target.value)
                                ) {
                                  field.onChange(e.target.value);
                                }
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-x-4 justify-between">
              <div className="flex flex-row gap-3 items-center justify-between rounded-lg border border-border/50 px-4 py-2 bg-card/50 w-full">
                <div className="text-center flex items-center">
                  <Info className="h-4 w-4 mr-2 text-blue-400" />
                  <h5 className="text-primary/90">{dynamicContent}</h5>
                </div>
              </div>
              <Button
                disabled={
                  isSubmitting ||
                  initialData.saleStatus === form.watch("saleStatus")
                }
                type="submit"
              >
                Save
              </Button>
            </div>
          </form>

          {Object.entries(errors).map(([key, error]) => (
            <p key={key} className="text-red-500 text-sm mt-2">
              {key.charAt(0).toUpperCase() + key.slice(1)}: {error?.message}
            </p>
          ))}
        </Form>
      )}
    </div>
  );
};
