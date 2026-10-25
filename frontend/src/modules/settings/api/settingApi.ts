import api from "@/shared/api/apiClient";

export interface SchoolSettings {
  school_name: string;
  school_phone: string;
  school_email: string;
  school_address: string;
  telegram_chat_id: string;
  logo_url: string;
  banner_url: string;
}

export type SchoolSettingsErrors = Partial<Record<keyof SchoolSettings, string[]>>;

export const getSettings = () => api.get<SchoolSettings>("/settings");

export const updateSettings = (data: SchoolSettings) =>
  api.put<{ message: string }>("/settings", data);
