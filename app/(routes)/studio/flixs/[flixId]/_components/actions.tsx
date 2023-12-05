"use client";

import axios from "axios";
import { ArrowLeft, Trash, Rocket } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { useConfettiStore } from "@/hooks/use-confetti-store";

interface ActionsProps {
  disabled: boolean;
  flixId: string;
  isPublished: boolean;
  completionText: string;
}

export const Actions = ({ disabled, flixId, isPublished, completionText }: ActionsProps) => {
  const router = useRouter();
  const confetti = useConfettiStore();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = () => {
    router.push("/fundz");
  };

  const onClick = async () => {
    try {
      setIsLoading(true);

      if (isPublished) {
        await axios.patch(`/api/flixs/${flixId}/unpublish`);
        toast({
          title: "Course unpublished",
          description: "The course has been successfully unpublished.",
        });
        confetti.onOpen();
      } else {
        await axios.patch(`/api/flixs/${flixId}/publish`);
        toast({
          title: "Course published",
          description: "The course has been successfully published.",
        });
        confetti.onOpen();
      }

      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setIsLoading(true);

      await axios.delete(`/api/flixs/${flixId}`);
      toast({
        title: "Course deleted",
        description: "The course has been successfully deleted.",
      });
      router.refresh();
      router.push(`/studio/flixs`);
    } catch {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-x-4">
      <div className="text-md text-primary/80">{completionText}</div>
      <Button
        onClick={handleClick}
        className="flex items-center text-sm hover:opacity-75 transition"
        variant="outline"
      >
        {/* <ArrowLeft className="h-4 w-4 mr-2" /> */}
        Back to flix list
      </Button>

      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        variant="outline"
        size="sm"
      >
        {" "}
        {/* <Rocket className="h-4 w-4 mr-2" /> */}
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
      <ConfirmModal onConfirm={onDelete}>
        <Button size="sm" disabled={isLoading}>
          <Trash className="h-4 w-4" />
        </Button>
      </ConfirmModal>
    </div>
  );
};
