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
import { Editor } from "@/components/editor";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { uploadFiles } from "@/lib/uploadthing";
import useCrowdFundingStore from "@/store/crowdFundingStore";
import { addDays } from "date-fns";
import { fetchAddress } from "@/lib/walletUtil";
import { storeJSONToWeb3Storage } from "@/service/Web3Storage";
import { useRouter } from "next/navigation";

const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = addDays(new Date(), 1);

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
  endDate: z.date().refine((date) => date > today, {
    message: "End date must be a date after today.",
  }),
  story: z.string().min(1),
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
  storyOneline: z.string().min(1),
});

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
  const { createCampaign } = useCrowdFundingStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: undefined,
      endDate: tomorrow,
      story: "",
      title: "",
      image: undefined,
      storyOneline: "",
    },
  });

  const { isSubmitting, isValid, errors } = form.formState;

  const calculateDaysLeft = (endDate: Date | undefined) => {
    if (!endDate) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day

    // Clone the endDate to avoid mutating the original date
    const end = new Date(endDate.getTime());
    end.setHours(0, 0, 0, 0); // Normalize end date to start of day

    const timeDiff = end.getTime() - today.getTime();
    if (timeDiff < 0) return 0; // No negative days

    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysLeft;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // return router.push('/fundz')

    const { price, endDate, story, title, storyOneline } = values;

    const deadline = new Date(endDate).getTime();

    // Ensure the file exists and is a File instance
    if (values.image && values.image instanceof File) {
      try {
        const [res] = await uploadFiles({
          files: [values.image],
          endpoint: "imageUploader",
        });

        const args = {
          ...{ price, endDate, story, title, storyOneline, deadline },
          imageUrl: res.url,
        };

        console.log("args: ", args);

        const web3StorageResponse = await storeJSONToWeb3Storage(
          args,
          "campaigndata.json"
        );
        const campaignURI = `${web3StorageResponse}/campaigndata.json`;

        console.log("campaignURI: ", campaignURI);

        const hash = await createCampaign({
          walletAddress,
          price,
          deadline,
          campaignURI,
        });

        console.log("hash", hash);

        router.push("/fundz");
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    } else {
      console.error("No file or invalid file provided");
    }
  };

  return (
    <div className="p-6">
      {/* {isLoading && <Loader />} */}
      <Link
        href={`/fundz`}
        className="flex items-center text-sm hover:opacity-75 transition mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to fundz list view
      </Link>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-2">
          <h1 className="text-3xl font-bold tracking-wider">
            Create a new <span className="font-black text-[#8b7ad0]">ART</span>
          </h1>
          <span className="text-sm text-primary">Complete all fields</span>
        </div>
        <div className="flex items-center gap-x-2">
          <Button
            disabled={!isValid || isSubmitting}
            type="submit"
            form="hook-form"
          >
            Create
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form
          id="hook-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full mt-10 flex flex-col gap-10"
        >
          <div className="flex gap-10">
            <div className="border rounded-md p-4 font-medium flex flex-col gap-8 w-1/2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Art title</FormLabel>
                    <FormControl>
                      <Input placeholder="Give a title" {...field} />
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
                    <FormLabel>Cover Image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple={false}
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
                    <FormDescription>
                      Select an image under 10MB
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="w-full flex justify-center items-center p-4 bg-[#8b7ad0] h-[50px] rounded-[10px]">
                {/* <img
                    src={money}
                    alt="money"
                    className="w-[40px] h-[40px] object-contain"
                /> */}
                <h4 className="font-epilogue font-bold text-2xl text-center text-white">
                  You will get <span className="text-[#fcd769]">100%</span> of
                  the raised amount
                </h4>
              </div>
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="flex flex-row gap-3 items-center justify-between rounded-lg border p-4 bg-card w-1/2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Fund needed</FormLabel>
                        <FormDescription className="whitespace-nowrap">
                          Set the required Fund needed
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
                          className="max-w-[40%] font-bold text-[#8b7ad0] text-lg"
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
                <div className="flex flex-row gap-3 items-center justify-between rounded-lg border p-4 bg-card w-1/2 ">
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex justify-between w-full">
                        <div className="space-y-0.5">
                          <FormLabel htmlFor="date" className="text-base">
                            End time
                          </FormLabel>
                          <FormDescription className="whitespace-nowrap">
                            Set Campaign End time
                          </FormDescription>
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-[240px] pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <FormField
                control={form.control}
                name="story"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">
                      Story description
                    </FormLabel>
                    <FormControl>
                      <Editor {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="storyOneline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Story oneline</FormLabel>
                    <FormControl>
                      <Input
                        className="h-[50px]"
                        placeholder="Give a one line of the flix"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="border rounded-md p-4 font-medium flex flex-col gap-8 w-1/2 relative">
              <div className="absolute top-[50%] -left-3 z-10 rounded-t-md tracking-widest transform translate-y-full -translate-x-1/4 text-primary px-3 rotate-90 backdrop-blur-md bg-opacity-20 bg-blue-100 border-blue-100">
                Preview
              </div>

              {/* Image Preview */}
              <div className="group hover:shadow-sm w-full rounded-3xl bg-card cursor-pointer hover:bg-card">
                <div className="relative">
                  {form.watch("image") ? (
                    <Image
                      src={URL.createObjectURL(form.watch("image"))}
                      alt={`Selected thumbnail`}
                      className={`w-full object-cover rounded-t-3xl max-h-[300px]`}
                      width={150}
                      height={50}
                      layout="responsive"
                    />
                  ) : (
                    <div className="w-full object-cover rounded-t-3xl flex justify-center items-center bg-gray-200 dark:bg-[#202020] h-[300px]">
                      <span className="text-3xl font-black text-card tracking-widest">
                        select a cover image
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex flex-col justify-end h-full p-5 space-y-3">
                      <p className="text-muted dark:text-muted-foreground mb-2 text-xl">
                        {form.watch("storyOneline")
                          ? form.watch("storyOneline")
                          : "Give oneline of the flix"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col p-4 space-y-4 mx-3">
                  <div>
                    <h3 className="text-2xl font-bold text-primary leading-6 truncate">
                      {form.watch("title")
                        ? form.watch("title")
                        : "Give a title"}
                    </h3>
                  </div>

                  <div className="flex justify-between flex-wrap space-y-2">
                    <div className="flex flex-col items-start">
                      <h4 className="text-xl font-semibold text-[#8b7ad0] leading-5">
                        0 XZO
                        <span className="text-md text-foreground truncate">
                          <span className="text-gray-400 font-medium">
                            &nbsp; raised of &nbsp;
                          </span>
                          {form.watch("price") ? form.watch("price") : "0"}
                          &nbsp;XZO
                        </span>
                      </h4>
                    </div>
                    <div className="flex flex-col items-start">
                      <h4 className="text-xl font-semibold text-foreground leading-5">
                        {calculateDaysLeft(form.watch("endDate"))}
                        <span className="text-md text-gray-400 truncate">
                          {" "}
                          {calculateDaysLeft(form.watch("endDate")) > 1
                            ? "Days Left"
                            : "Day Left"}
                        </span>
                      </h4>
                    </div>
                  </div>
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
};

export default CreateCampaign;
