function minifyText(text: string) {
  // Check if the text is an Ethereum address with the 0x prefix
  if (text.startsWith('0x')) {
    // Extract the first four characters after the 0x prefix
    const start = text.slice(2, 6);
    // Extract the last four characters
    const end = text.slice(-4);
    // Combine them with ellipsis
    return `0X ${start}...${end}`;
  }

  // If it's not an Ethereum address or doesn't start with 0x, return the text as it is
  return text;
}

export default minifyText;
