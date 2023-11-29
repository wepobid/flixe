export const fetchAddress = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
            return accounts[0] || null;
        } catch (error) {
            console.error("Error fetching Ethereum accounts:", error);
            return null;
        }
    } else {
        return null;
    }
};
