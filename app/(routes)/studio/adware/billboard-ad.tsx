"use client";

import * as z from "zod";
import React, { useEffect, useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { uploadFiles } from "@/lib/uploadthing";
import { storeJSONToWeb3Storage } from "@/service/Web3Storage";
import AdwareInteraction from "@/contracts/AdwareInteraction";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  price: z
    .string()
    .refine(
      (value) => !isNaN(parseFloat(value)) && parseFloat(value) >= 0.0001,
      {
        message: "Price should be more than 0.0001",
        path: ["price"],
      }
    ),
  title: z.string().min(1, {
    message: "Title is required",
  }),
  image: z
    .custom<File>(
      (file) => {
        console.log("Validating file:", file);
        return file instanceof File;
      },
      {
        message: "Image is required",
      }
    )
    .refine(
      (file) => {
        const isValidSize = file.size <= 10 * 1024 * 1024;
        console.log("Checking file size:", isValidSize);
        return isValidSize;
      },
      {
        message: `The image must be a maximum of 10MB.`,
      }
    ),
  button: z.string().min(1),
  url: z.string().min(1),
});

export default function VideoAd() {
  const adwareInteraction = AdwareInteraction();
  const [topBid, setTopBid] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: undefined,
      title: "",
      image: undefined,
      button: "",
      url: "",
    },
  });

  const { isSubmitting, isValid, errors } = form.formState;
  const { reset } = form;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { price, title, image, button, url } = values;
    // Ensure the file exists and is a File instance
    if (image && image instanceof File) {
      try {
        const [res] = await uploadFiles({
          files: [values.image],
          endpoint: "imageUploader",
        });
        const args = {
          ...{ price, title, button, url },
          imageUrl: res.url,
        };
        console.log("args: ", args);
        const web3StorageResponse = await storeJSONToWeb3Storage(
          args,
          "campaigndata.json"
        );
        const campaignURI = `${web3StorageResponse}/campaigndata.json`;
        console.log("campaignURI: ", campaignURI);
        const hash = await adwareInteraction.bidForBillboardAd(
          campaignURI,
          parseFloat(price)
        );
        console.log("hash", hash);
        reset();
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    } else {
      console.error("No file or invalid file provided");
    }
  };

  useEffect(() => {
    const fetchTopBids = async () => {
      try {
        let bit = await adwareInteraction.listTodayTopBid();
        if (Number(bit) == 0) {
          bit = await adwareInteraction.startingBidPrice();
        }
        setTopBid(Number(bit));
      } catch (err) {}
    };

    fetchTopBids();
  }, [adwareInteraction]);

  useEffect(() => {
    const checkAndStartAuction = async () => {
      try {
        const currentDetails = await adwareInteraction.getCurrentBillboardDetails();
        // Check if the current time is past the auction end time
        if (Math.floor(Date.now() / 1000) >= Number(currentDetails.auctionEndTime)) {
          // If the auction has ended, initiate a new auction
          await adwareInteraction.initiateNewBillboardAuction();
        }
      } catch (error) {
        console.error('Error checking auction:', error);
      }
    };
  
    // Call immediately on page load
    checkAndStartAuction();
  
    // Set interval for periodic checking every 2 hours (7200000 milliseconds)
    const interval = setInterval(checkAndStartAuction, 7200000);
  
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);  

  return (
    <div className="pt-6">
      <Form {...form}>
        <form
          id="hook-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full flex flex-col gap-8"
        >
          {/* Image Preview */}
          <div className="border rounded-md p-4 font-medium flex flex-col gap-8 relative">
            <div className="absolute top-[50%] -left-3 z-10 rounded-t-sm tracking-widest transform translate-y-full -translate-x-1/4 text-primary px-3 rotate-90 backdrop-blur-md bg-opacity-20 bg-blue-100 border-blue-100">
              Preview
            </div>

            <div className="group hover:shadow-sm w-full rounded-3xl bg-card cursor-pointer hover:bg-card">
              <div className="relative">
                {form.watch("image") ? (
                  <div className="aspect-w-3 aspect-h-1 w-full">
                    <Image
                      src={URL.createObjectURL(form.watch("image"))}
                      alt={`Selected thumbnail`}
                      className={`object-cover rounded-sm`}
                      layout="fill"
                    />
                  </div>
                ) : (
                  <div className="relative w-full bg-gray-200 dark:bg-[#202020] aspect-w-3 aspect-h-1 rounded-sm">
                    <div className="absolute inset-0 flex justify-center items-center">
                      <p className="text-4xl font-black text-center text-card tracking-widest">
                        Set the Billboard Ad Poster
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="hidden group-hover:flex flex-row justify-between absolute bottom-0 inset-x-0">
                <div className="bg-background/20 backdrop-blur-xl px-4 py-2 m-8 h-12 rounded-2xl flex items-center justify-center">
                  <h4 className="text-lg font-semibold text-primary ">
                    {form.watch("title") || "Give a title to your billboard"}
                  </h4>
                </div>

                <div className="flex justify-between flex-wrap space-y-2 px-4 py-2 m-8 h-12 rounded-2xl">
                  <div className="flex flex-col items-start">
                    <Button
                      type="submit"
                      className="max-w-sm m-auto bg-muted/40 text-primary border hover:bg-black/20 border-black/20 backdrop-blur-xl"
                      onClick={(e) => {
                        e.preventDefault();
                        const url = form.watch("url");
                        window.open(url, "_blank");
                      }}
                    >
                      <Link2 className="h-5 w-5" />
                      {form.watch("button") && (
                        <> &nbsp; &nbsp; {form.watch("button")}</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-8">
            <div className="border rounded-md p-4 font-medium flex flex-col gap-8 w-1/2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary/70">
                      Billboard Ad Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="bg-card"
                        placeholder="Give a title to your billboard"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage>
                      {errors.title && <span>{errors.title.message}</span>}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary/70">
                      Billboard Ad Poster
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple={false}
                        className="bg-card"
                        // Spread all properties except 'value'
                        {...{ ...field, value: undefined }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            field.onChange(file);
                          }
                        }}
                      />
                    </FormControl>
                    {/* <FormDescription>
                      Select an image under 10MB
                    </FormDescription> */}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="flex flex-row gap-3 items-center justify-between rounded-lg border p-4 bg-card w-full">
                      <div className="space-y-0.5">
                        <FormLabel className="text-primary/90 text-base">
                          Bit Amount
                        </FormLabel>
                        <FormDescription className="whitespace-nowrap">
                          Current highest bit amount is {topBid} XZO
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Input
                          type="text"
                          pattern="^(?:[1-9]\d*|0)?(?:\.\d+)?$"
                          placeholder="Price"
                          value={
                            field.value == null ? "0" : field.value.toString()
                          }
                          className="max-w-[40%] font-bold text-[#6ca987] text-lg"
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
            </div>
            <div className=" w-1/2 flex flex-col gap-8 justify-start">
              <div className="border bg-background rounded-md p-4 flex flex-col gap-8">
                <FormField
                  control={form.control}
                  name="button"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary/70 font-medium">
                        Action Button Title
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="bg-card"
                          placeholder="Give a name to the action button"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-primary/70 font-medium">
                        Action URL
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="bg-card"
                          placeholder="Set the action button URL"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Separator className="max-w-[90%] m-auto" />
                <div className="rounded-md p-1 w-full flex gap-8 justify-center border bg-card">
                  <Button
                    name="reset"
                    type="reset"
                    disabled={isSubmitting}
                    onClick={() => reset()}
                    className="max-w-sm bg-transparent text-primary/60 hover:bg-trasparent hover:text-primary text-md font-bold"
                  >
                    Reset
                  </Button>
                  {true ? (
                    <Button
                      type="submit"
                      disabled={isSubmitting || !isValid}
                      className="max-w-sm bg-background border text-primary/80 hover:bg-muted text-md font-semibold"
                    >
                      {isSubmitting ? 'loading...' : 'Place a Bit'}
                    </Button>
                  ) : (
                    <Button
                      name="rebit"
                      type="submit"
                      variant="ghost"
                      className="max-w-sm bg-transparent text-primary hover:bg-muted"
                    >
                      Rebit for Billboard Ad
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {Object.entries(errors).map(([key, error]) => (
          <p key={key} className="text-red-500 text-sm mt-2">
            {key.charAt(0).toUpperCase() + key.slice(1)}: {error?.message}
          </p>
        ))}
      </Form>
    </div>
  );
}
