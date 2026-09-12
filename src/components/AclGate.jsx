import { useAuth } from "../contexts/AuthContext";

export default function AclGate({ module, action = "view", children, fallback = null }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(module, action)) {
    return fallback;
  }
  return children;
}
