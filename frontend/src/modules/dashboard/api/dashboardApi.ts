import api from "@/shared/api/apiClient";
import type { AxiosResponse } from "axios";
import type { DashboardData } from "@/modules/dashboard/types/dashboard";

export interface DashboardFilters {
  from_date?: string;
  to_date?: string;
}

export const getDashboard = (filters?: DashboardFilters): Promise<AxiosResponse<DashboardData>> =>
  api.get<DashboardData>("/dashboard", { params: filters });
