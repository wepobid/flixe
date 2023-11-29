"use client";

import * as z from "zod";
import axios from "axios";
import { AlertTriangle, Pencil, PlusCircle, Video } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Episode, VideoData } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import DropZone from "@/components/DropZone";
import { useFormStore } from "@/store/formStore";
import VideoUploadComponent from "@/app/(routes)/(flixe)/upload/_components/VideoUploadComponent";
import { Player, useAssetMetrics, useCreateAsset } from "@livepeer/react";

import Image from "next/image";
import AmbientLivepeerPlayer from "./ambient-video";

interface EpisodeVideoFormProps {
  initialData: Episode & { videoData?: VideoData | null };
  flixId: string;
  episodeId: string;
  edit: boolean;
}

const formSchema = z.object({
  videoUrl: z.string().min(1),
});

export const EpisodeVideoForm = ({
  initialData,
  flixId,
  episodeId,
  edit,
}: EpisodeVideoFormProps) => {

  const { toast } = useToast();

  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);

  const { resetFormData, formData } = useFormStore();

  const [isUploading, setIsUploading] = useState(false);

  const toggleEdit = () => {
    resetFormData();
    setIsEditing((current) => !current);
  };

  const assetCreationCompleteRef = useRef("");
  const progressFormattedRef = useRef<string>("waiting");


  const {
    mutate: createAsset,
    data: asset,
    status,
    progress,
    error,
  } = useCreateAsset(
    formData.video
      ? {
          sources: [
            { name: formData.video.name, file: formData.video },
          ] as const,
        }
      : null
  );

  const { data: metrics } = useAssetMetrics({
    assetId: asset?.[0].id,
    refetchInterval: 30000,
  });

  const isLoading = useMemo(
    () =>
      status === "loading" ||
      (asset?.[0] && asset[0].status?.phase !== "ready"),
    [status, asset]
  );

  const progressFormatted = useMemo(
    () => {
      const value = progress?.[0].phase === "failed"
        ? "Failed to process video."
        : progress?.[0].phase === "waiting"
        ? "Waiting..."
        : progress?.[0].phase === "uploading"
        ? `Uploading: ${Math.round(progress?.[0]?.progress * 100)}%`
        : progress?.[0].phase === "processing"
        ? `Processing: ${Math.round(progress?.[0].progress * 100)}%`
        : "waiting";
      
      progressFormattedRef.current = value;
      return value;
    },
    [progress]
  );


  useEffect(() => {
    if (asset?.[0]?.id) {
      console.log("asset---->");
      console.log(asset);
      if (asset?.[0]?.playbackId) {
        assetCreationCompleteRef.current = asset?.[0]?.playbackId;
      }
    }
  }, [asset]);

  // const onSubmit = async (values: z.infer<typeof formSchema>) => {

  const delay = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));

  const onSubmit = async () => {
    try {
      setIsUploading(true);
      assetCreationCompleteRef.current = "";
      console.log("Asset ID attemplt --- ");
      //make it wait till isLoading become false
      await createAsset?.();

      while (!assetCreationCompleteRef.current) {
        await delay(500);
        // if (progressFormattedRef.current?.includes("Processing") && isEditing) {
        //   setIsEditing(false);
        //   setIsUploading(false);
        // }
      }

      let videoUrl;
      let retries = 3;

      while (retries > 0) {
        try {
            videoUrl = "https://lvpr.tv/?v=" + assetCreationCompleteRef.current;
            console.log("videoUrl:", videoUrl);
            break;
        } catch (error) {
          if (progressFormattedRef.current?.includes("Processing") && isUploading && assetCreationCompleteRef.current) {
                retries--;
                console.log(`Retrying... (${retries} attempts left)`);
            } else {
                console.error("Retry Failed:", error);
                throw error;
            }
        }
    } 
    
    // Ensure videoUrl was set
    if (!videoUrl) {
        throw new Error("Failed to get video URL after all retries.");
    }
    
    const data = {
        videoUrl: videoUrl,
    };

      await axios.patch(`/api/flixs/${flixId}/episodes/${episodeId}`, data);

      toast({
        title: "Episode updated",
        description: "The episode has been successfully updated.",
      });

      router.refresh();

      toggleEdit();
    } catch (error) {
      console.error("Error encountered:", error);
      setIsUploading(false);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      });
    }
  };

  const PosterImage = () => {
    return (
      initialData?.imageUrl && (
        <Image
          src={initialData.imageUrl}
          alt="thumbnail"
          layout="fill"
          objectFit="cover"
          priority
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,...yourBase64Here..."
        />
      )
    );
  };

  return (
      edit ? (
        <div className="mt-6 border bg-background rounded-md p-4">
          <div className="font-medium flex items-center justify-between">
            Episode video
            <div>
              {!isUploading && formData.video && (
                <Button onClick={onSubmit} variant="ghost">
                  Upload
                </Button>
              )}
              {isUploading && (
                <Button variant="ghost" disabled>
                  {progressFormatted}
                </Button>
              )}
              {!isUploading && (
                <Button
                  onClick={toggleEdit}
                  variant="ghost"
                  disabled={isUploading}
                >
                  {isEditing
                    ? "Cancel"
                    : initialData.videoUrl
                    ? "Edit video"
                    : "Add a video"}
                </Button>
              )}
            </div>
          </div>
          {!isEditing &&
            (!initialData.videoUrl ? (
              <div className="flex items-center justify-center h-60 bg-card rounded-md">
                <Video className="h-10 w-10 text-slate-500" />
              </div>
            ) : (
              <div className="relative aspect-[16/9] mt-2 rounded-xl overflow-hidden">
                <Player
                  title={initialData.title}
                  poster={<PosterImage />}
                  playbackId={new URL(initialData.videoUrl).searchParams.get(
                    "v"
                  )}
                  objectFit="cover"
                  priority
                />
              </div>
            ))}
          {isEditing && (
            <div>
              {!formData.video ? (
                <DropZone button={false} />
              ) : (
                <VideoUploadComponent episodeThumbnail={initialData.imageUrl} />
              )}
              <div className="text-xs text-muted-foreground mt-4">
              Upload the video for this episode. Keep it open until the upload process is fully complete.
              </div>
            </div>
          )}
          {initialData.videoUrl && !isEditing && (
            <div className="text-xs text-muted-foreground mt-2">
              Videos can take a few minutes to process. Refresh the page if
              video does not appear.
            </div>
          )}
        </div>
      ) : !initialData.videoUrl ? (
        <div className="flex items-center justify-center h-60 bg-card rounded-md">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Video Not found
        </div>
      ) : (
          <AmbientLivepeerPlayer
              title={initialData.title}
              poster={<PosterImage />}
              videoUrl={initialData.videoUrl}
          />
      )
  );
};
