"use client";

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
import Web3 from 'web3';
  
  interface DonationData {
    [0]: string[];  // Addresses
    [1]: number[];  // Donation amounts in Sun
  }
  
  interface DonationTableProps {
    donationData: DonationData;
  }
  
  interface Donation {
    address: string;
    amount: string;
  }
  
  const DonationTable: React.FC<DonationTableProps> = ({ donationData }) => {
    // Map donation data to an array of Donation objects
    const donations: Donation[] = donationData[0].map((address, index): Donation => ({
      address,
      amount: `${Web3.utils.fromWei(Number(donationData[1][index]), "ether")} XZO`,
    }));
  
    return (
      <Table>
        {/* <TableCaption>List of Donations</TableCaption> */}
        <TableHeader>
          <TableRow>
            <TableHead>No.</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {donations.length > 0 ? (
            donations.map((donation, index) => (
              <TableRow key={`${donation.address}-${index}`}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{donation.address}</TableCell>
                <TableCell className="text-right">{donation.amount}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center">
                No donors yet. Be the first one!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };
  
  export default DonationTable;
  