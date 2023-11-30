import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ThreeDModel from "./ThreeDModel";
import { Button } from "@/components/ui/button";
import { Expand } from "lucide-react";
import { Preview } from '@/components/preview';

type FilePreviewProps = {
  file: File;
  fileType: "Image" | "Model" | "Video" | "Music" | "Unknown";
};

const FilePreview: React.FC<FilePreviewProps> = ({ file, fileType }) => {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const previewSize = { width: 500, height: 500 }; // fixed size for 1:1 aspect ratio

  useEffect(() => {
    if (file) {
      const src = URL.createObjectURL(file);
      setPreviewSrc(src);
      return () => URL.revokeObjectURL(src);
    }
  }, [file]);

  const renderPreview = () => {
    switch (fileType) {
      case "Image":
        return (
          <Image
            src={previewSrc ?? ""}
            alt="Preview"
            layout="fill"
            objectFit="cover"
          />
        );
      case "Model":
        return (
          <ThreeDModel
            modelUrl={previewSrc ?? ""}
            modelScale={1}
            animate={true}
            enableDamping={true}
            enablePan={true}
            enableZoom={true}
            loader={<p>Loading Model...</p>}
          />
        );
      case "Video":
        return (
          <video
            controls
            src={previewSrc ?? ""}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          >
            <source src={previewSrc ?? ""} type={file.type} />
          </video>
        );
      case "Music":
        return (
          <audio
            controls
            src={previewSrc ?? ""}
            style={{ width: "100%", height: "100%" }}
          >
            <source src={previewSrc ?? ""} type={file.type} />
          </audio>
        );
      default:
        return (
          <div className="flex justify-center items-center bg-card w-[100%] h-[100%] rounded-lg text-center p-5">
            Select any Image, 3D Model, Video or Music Art
          </div>
        );
    }
  };

  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const onImageLoad = (e: any) => {
    const { naturalWidth, naturalHeight } = e.target;
    setImageSize({ width: naturalWidth, height: naturalHeight });
  };

  const renderPopoverContent = () => {
    switch (fileType) {
      case "Image":
        return (
          <Image
            src={previewSrc ?? ""}
            alt="Original"
            layout="responsive"
            width={imageSize.width || 800}
            height={imageSize.height || 800}
            onLoad={onImageLoad}
          />
        );
      case "Video":
        // For videos, use a video tag with controls
        return (
          <video
            src={previewSrc ?? ""}
            controls
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        );
      case "Model":
        // For 3D models, use your ThreeDModel component
        // Ensure it's capable of handling the model URL and adjust props as necessary
        return (
          <ThreeDModel
            modelUrl={previewSrc ?? ""}
            modelScale={1}
            animate={true}
            enableDamping={true}
            enablePan={true}
            enableZoom={true}
            loader={<p>Loading Model...</p>} // Adjust loader as necessary
          />
        );
      default:
        // Default case for unsupported file types
        return <div>Unsupported file type</div>;
    }
  };
  return (
    <div
      style={{ position: "relative", ...previewSize }}
      className="border border-border m-auto w-full rounded-lg overflow-hidden"
    >
      {renderPreview()}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="absolute top-0 right-0 z-10 m-4 rounded-full bg-foreground/10 hover:bg-muted-foreground/20 p-3 backdrop-filter backdrop-blur-md text-white">
            <Expand className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="w-[80%] h-[80%] flex flex-col justify-center items-center">
          <AlertDialogHeader><h1>Art Preview</h1></AlertDialogHeader>
          <AlertDialogDescription>
            {renderPopoverContent()}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FilePreview;
