import axios from "axios";

const pinataBaseURL = "https://api.pinata.cloud";

// function to test if the pinata service is available
export const testPinataService = async () => {
    const response = await axios.get(
        `${pinataBaseURL}/data/testAuthentication`,
        {
            headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
            },
        }
    );

    return response.data;
};

// function to fetch the ipfs file
export const fetchIPFSJson = async (hash: string) => {
    const response = await axios.get(
        `https://gateway.pinata.cloud/ipfs/${hash}`
    );
    return response.data;
};

// function to pin a file to pinata
export const pinFileToPinata = async (file: File) => {
    const data = new FormData();
    data.append("file", file);

    const response = await axios.post(
        `${pinataBaseURL}/pinning/pinFileToIPFS`,
        data,
        {
            headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
            },
        }
    );

    return response.data;
};

// function to pin a JSON object to pinata
export const pinJSONToPinata = async (JSONBody: any) => {
    const response = await axios.post(
        `${pinataBaseURL}/pinning/pinJSONToIPFS`,
        {
            pinataContent: JSONBody,
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
};

// function to unpin a file from pinata using CID
export const unpinFileFromPinata = async (CID: string) => {
    const response = await axios.delete(
        `${pinataBaseURL}/pinning/unpin/${CID}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
            },
        }
    );

    return response.data;
};
