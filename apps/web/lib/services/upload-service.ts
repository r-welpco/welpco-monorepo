import { apiClient } from "@/lib/api/client";

interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}

export async function getPresignedUrl(
  fileName: string,
  contentType: string
): Promise<PresignedUrlResponse> {
  return apiClient.post<PresignedUrlResponse>("/api/uploads/presigned-url", {
    fileName,
    contentType,
  });
}

export async function uploadFileToS3(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
}
