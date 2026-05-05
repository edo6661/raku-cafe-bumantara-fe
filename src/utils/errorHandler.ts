import { isAxiosError } from "axios";
import type { ActionResult } from "../types/common";

export const handleApiError = (error: unknown): ActionResult => {
  if (import.meta.env.DEV) {
    console.error("API Request failed:", error);
  }

  if (isAxiosError(error)) {
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Terjadi kesalahan pada server. Silakan coba lagi.",
      errors: error.response?.data?.error,
    };
  }

  return {
    success: false,
    message:
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan tidak terduga.",
  };
};

// Helper baru untuk map error field ke state form UI
export const applyApiErrors = <T>(
  error: unknown,
  setFormErrors: React.Dispatch<
    React.SetStateAction<Partial<Record<keyof T, string>>>
  >,
) => {
  const result = handleApiError(error);
  if (
    result.errors &&
    Array.isArray(result.errors) &&
    result.errors.length > 0
  ) {
    const newErrors: Record<string, string> = {};
    result.errors.forEach((err) => {
      newErrors[err.field] = err.message;
    });
    setFormErrors(newErrors as Partial<Record<keyof T, string>>);
  } else {
    alert(result.message);
  }
};
