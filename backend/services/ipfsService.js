import axios from "axios";
import FormData from "form-data";

export async function uploadToIPFS(fileBuffer, fileName) {
  const formData = new FormData();
  formData.append("file", fileBuffer, fileName);

  const response = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    formData,
    {
      maxBodyLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
    }
  );

  return response.data.IpfsHash;
}