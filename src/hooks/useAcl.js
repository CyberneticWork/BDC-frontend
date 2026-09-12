import { useAuth } from "../contexts/AuthContext";

export default function useAcl(module) {
  const { hasPermission } = useAuth();
  return {
    canView: hasPermission(module, "view"),
    canAdd: hasPermission(module, "add") || hasPermission(module, "edit"),
    canEdit: hasPermission(module, "edit"),
    canDelete: hasPermission(module, "delete"),
    canApprove: hasPermission(module, "approve"),
    hasPermission,
  };
}
