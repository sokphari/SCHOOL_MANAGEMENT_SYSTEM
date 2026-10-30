import { useContext } from "react";
import { AuthContext } from "@/modules/auth/context/authContext";

export const useAuth = () => useContext(AuthContext);
