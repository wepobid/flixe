"use client";

import * as React from "react";
import WalletIcon from "./ui/wallet-icon";
import { useWalletConnection } from "@/hooks/connectWallet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/store/walletStore";
import { fetchAddress } from "@/lib/walletUtil";
import { useCallback, useState } from "react";
import axios from "axios";
import { useToast } from "./ui/use-toast";
import { useSession } from "next-auth/react";
import { useSignOut } from "@/hooks/signOut";
import { useWallet } from "@/hooks/connectWalletHook";
import minifyText from "@/lib/minify";
import { CreditCard, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WalletConnection() {
  useWallet();

  const { status } = useSession();
  const { connectWallet, error } = useWalletConnection();
  const { modal, setModal, modalResolver } = useWalletStore();
  const [walletAddress, setWalletAddress] = useState(null);

  const updateWalletAddress = async () => {
    const address = await fetchAddress();
    setWalletAddress(address);
  };

  React.useEffect(() => {
    updateWalletAddress();
  }, []);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [name, setName] = useState("");
  const handleScreenInClick = async () => {
    setIsLoggingIn(true);
    await connectWallet();
    setIsLoggingIn(false);
  };
  const onSubmit = useCallback(async () => {
    try {
      setIsLoading(true);
      await axios.post("/api/register", {
        walletAddress,
        username: walletAddress,
        name,
      });
      setIsLoading(false);
      toast({
        title: "🥳! Profile Created.",
        description: "Your personalized profile is ready!",
      });
      modalResolver(true);
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null) {
        const typedError = error as Record<string, any>;
        if (typedError.response?.data?.message) {
          toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: typedError.response.data.message,
          });
        }
      }
      modalResolver(false);
      throw error;
    } finally {
      setIsLoading(false);
      setModal(false);
    }
  }, [walletAddress, name, toast, modalResolver, setModal]);
  const { handleSignOut } = useSignOut();

  const handleScreenOutClick = () => {
    handleSignOut();
  };
  return (
    <>
      {status !== "authenticated" ? (
        <>
          <Button
            className="group h-9 right-[4%] rounded-sm backdrop-blur-md border font-bold text-[#e88b2f] hover:text-primary border-zinc-600 hover:bg-[rgb(43,36,28)] bg-[rgb(43,36,28)] hover:dark:border-[#e88b2f] hover:text-[#e88b2f]"
            onClick={handleScreenInClick}
            disabled={isLoggingIn}
          >
            <WalletIcon className="mr-2 h-5 w-5" />
            {isLoggingIn ? "Connecting..." : "Screen In"}
            <span className="sr-only">Wallet Connection</span>
          </Button>
          {walletAddress && (
            <Dialog
              open={modal}
              onOpenChange={() => {
                setIsLoggingIn(false);
                setModal(false);
              }}
            >
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-center text-3xl font-bold">
                    Welcome to Flixe
                  </DialogTitle>
                  <DialogDescription className="text-center">
                    Your journey into the heart of entertainment begins here.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-left">
                      Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Name"
                      className="col-span-3"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-left">
                      Username
                      <br />
                      <span className="text-xs text-priamry-80 text-left">
                        walletaddress
                      </span>
                    </Label>
                    <Input
                      id="username"
                      value={`${walletAddress}`}
                      className="col-span-3"
                      disabled
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogFooter>
                    <Button
                      type="submit"
                      onClick={onSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? "Loading..." : "Hop In 🎉"}
                    </Button>
                  </DialogFooter>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className='className="group h-9 right-[4%] rounded-sm backdrop-blur-md border font-bold text-muted-foreground hover:text-primary border-zinc-600 hover:bg-card bg-accent hover:dark:text-[#de8b8b] hover:dark:border-[#de8b8baa] hover:text-[#f33d3d]'>
              {/* <Image
                src="https://images.unsplash.com/photo-1575936123452-b67c3203c357?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=2070"
                alt={`Thumbnail`}
                className={`h-auto`}
                width={1}
                height={1}
                layout="responsive"
              /> */}
              {walletAddress ? minifyText(walletAddress) : "Not Connected"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem disabled>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
                {/* <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut> */}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Wallet</span>
                {/* <DropdownMenuShortcut>⌘B</DropdownMenuShortcut> */}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleScreenOutClick}>
              <LogOut className="mr-2 h-4 w-4" />
              Screen Out
              <DropdownMenuShortcut>⇧Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}

<DropdownMenuItem>
  <LogOut className="mr-2 h-4 w-4" />
  <span>Log out</span>
  <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
</DropdownMenuItem>;
