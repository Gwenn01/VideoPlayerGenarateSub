import { apiClient } from "./apiClient";
import type { TranslationResult } from "../types/translation";

// api for translate video
export const translateVideo = async (
  file: File,
): Promise<TranslationResult> => {
  const formData = new FormData();
  formData.append("video", file);
  return apiClient<TranslationResult>("translate/", {
    method: "POST",
    body: formData,
  });
};
