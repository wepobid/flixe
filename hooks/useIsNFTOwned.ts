import { useState, useEffect } from "react";
import MarketplaceInteraction from "@/contracts/MarketplaceInteraction";
import { toast } from "@/components/ui/use-toast";
import { fetchAddress } from "@/lib/walletUtil";
import Web3 from "web3";

const useIsNFTOwned = (flixNftId: number) => {
    const nftMarketplace = MarketplaceInteraction();
    const [isOwned, setIsOwned] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            const walletAddress = await fetchAddress();
            try {
                const ownerHex = await nftMarketplace.ownerOf(flixNftId);
                console.log("owner: ", ownerHex);

                const ownerHexChecksum = Web3.utils.toChecksumAddress(ownerHex);
                const walletChecksumAddress =
                    Web3.utils.toChecksumAddress(walletAddress);

                if (ownerHexChecksum === walletChecksumAddress) {
                    setIsOwned(true);
                    return;
                }

                const nftsOnSale = await nftMarketplace.fetchOwnedNFTsOnSale(
                    walletAddress
                );
                console.log("nftsOnSale: ", nftsOnSale);

                if (nftsOnSale.includes(flixNftId)) {
                    setIsOwned(true);
                    return;
                }

                const auctionDetails = await nftMarketplace.auctions(flixNftId);
                const auctionSellerChecksumAddress = Web3.utils.toChecksumAddress(
                    auctionDetails.seller
                );
                console.log("auctionDetails: ", auctionDetails);

                if (auctionSellerChecksumAddress === walletChecksumAddress) {
                    setIsOwned(true);
                    return;
                }

                setIsOwned(false);

                console.log("ower: ", isOwned);
            } catch (err: any) {
                toast({
                    variant: "destructive",
                    title: "Uh oh! Error while checking NFT ownership.",
                    description: err.message || "Error occurred.",
                });
            }
        };

        fetchData();
    }, [flixNftId]);

    console.log("isOwned: ", isOwned);

    return isOwned;
};

export default useIsNFTOwned;
