import api from "@/shared/api/apiClient";

export interface PublicSchoolSettings {
  school_name: string;
  school_phone: string;
  school_email: string;
  school_address: string;
  logo_url: string;
  banner_url: string;
}

export const getPublicSettings = () => api.get<PublicSchoolSettings>("/public/settings");
