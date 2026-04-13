import { UserRole } from "@/types/contracts";
import { rolePaths } from "@/utils/constants";

export const canAccessPath = (role: UserRole | null, pathname: string) => {
  if (!role) {
    return false;
  }

  return pathname.startsWith(rolePaths[role]);
};
