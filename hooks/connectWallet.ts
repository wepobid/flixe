import { toast } from "@/components/ui/use-toast";
import { useWalletStore } from "@/store/walletStore";
import axios from "axios";
import { signIn } from "next-auth/react";
import { useState } from "react";

export const useWalletConnection = () => {
    const [error, setError] = useState(false);
    const { setModal, setModalResolver, isConnected } = useWalletStore();
    const setIsConnected = useWalletStore((state) => state.setIsConnected);
    const setIsSupportedNetwork = useWalletStore((state) => state.setIsSupportedNetwork);

    const userSignIn = async (walletAddress: string, name: string) => {
        try {
            const response = await fetch("/api/auth/generateNonce", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ walletAddress, name }),
            });
            if (response.status !== 200) {
                throw new Error("Sign-in failed");
            }
            const responseData = await response.json();
            const signedNonce = await window.ethereum.request({
                method: 'personal_sign',
                params: [responseData.nonce, walletAddress],
            });
            await signIn("crypto", {
                walletAddress,
                signedNonce,
                callbackUrl: "http://localhost:3000/",
            });
        } catch (error) {
            setError(true);
            toast({
                variant: "destructive",
                title: "😟 Sry! Error Signing In",
                description: "Login failed",
            });
            throw error;
        }
    };

    const loginOrCreateUser = async (walletAddress: string) => {
        try {
            const response = await axios.post("/api/check-user", { walletAddress });
            if (response.status === 200) {
                if (!response.data.userExists) {
                    if (window.ethereum) {
                        const isRegistered = await new Promise<boolean>((resolve) => {
                            setModalResolver(resolve);
                            setModal(true);
                        });
                        if (isRegistered) {
                            await userSignIn(walletAddress, response.data.name);
                            toast({
                                title: "🥳 Welcome to Flixe",
                                description: "Your account has been created",
                            });
                        }
                    }
                } else {
                    await userSignIn(walletAddress, response.data.name);
                    toast({
                        title: "🥳 Welcome back",
                        description: "Login successful",
                    });
                }
            }
        } catch (error) {
            setError(true);
            toast({
                variant: "destructive",
                title: "😟 Sry! Some error has occurred",
                description: "Login failed",
            });
        }
    };

    const connectWallet = async () => {
        if (!isConnected) {
            if (window.ethereum) {
                try {
                    if (window.ethereum.networkVersion === process.env.NEXT_PUBLIC_ETH_NETWORK_ID) {
                        setIsSupportedNetwork(true);
                    } else {
                        setIsSupportedNetwork(false);
                        toast({
                            variant: "destructive",
                            title: "Oops! Wrong network.",
                            description: `😟 Please connect to ${process.env.NEXT_PUBLIC_ETH_NETWORK_NAME}`,
                        });
                        return;
                    }

                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
                    const walletAddress = accounts[0];
                    if (walletAddress) {
                        await loginOrCreateUser(walletAddress);
                    } else {
                        toast({
                            variant: "destructive",
                            title: "Oops! error getting wallet address.",
                        });
                    }
                    setIsConnected(true);
                } catch {
                    setError(true);
                    toast({
                        variant: "destructive",
                        title: "Oops! auto login failed.",
                    });
                }
            } else {
                toast({
                    variant: "destructive",
                    title: "Uh oh! Please install a wallet extension.",
                });
            }
        }
    };

    return { connectWallet, error };
};
