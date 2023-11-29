"use client"

import { Web3Storage } from "web3.storage";

const token = process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN;
if (!token) {
    throw new Error("Missing Web3.Storage API token");
}

const client = new Web3Storage({ token });

// function to store a file to Web3.Storage
export const storeFileToWeb3Storage = async (file: File) => {
    const cid = await client.put([file]);
    return cid;
};

// function to store a HTML file to Web3.Storage
export const storeHTMLFileToWeb3Storage = async (file: File | string) => {
    let files;
    if (typeof file === "string") {
        const blob = new Blob([file], { type: "text/html" });
        files = [new File([blob], "index.html")];
    } else {
        files = [file];
    }
    const cid = await client.put(files);
    return cid;
};

// function to store a JSON object to Web3.Storage
export const storeJSONToWeb3Storage = async (JSONBody: any, fileNmae: string) => {
    const file = new File([JSON.stringify(JSONBody)], fileNmae);
    const cid = await client.put([file]);
    return cid;
};

// function to fetch the ipfs file
export const fetchIPFSJson = async (cid: string) => {
    const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
    const data = await response.json();
    return data;
};
