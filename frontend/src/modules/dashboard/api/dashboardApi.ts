import api from "@/shared/api/apiClient";
import type { AxiosResponse } from "axios";
import type { DashboardData } from "@/modules/dashboard/types/dashboard";

export const getDashboard = (): Promise<AxiosResponse<DashboardData>> =>
  api.get<DashboardData>("/dashboard");
