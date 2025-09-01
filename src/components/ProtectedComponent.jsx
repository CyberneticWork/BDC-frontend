// src/components/ProtectedComponent.jsx
import { useAuth } from "../contexts/AuthContext";

const ProtectedComponent = ({ module, action, children, fallback = null }) => {
  const { hasPermission } = useAuth();
  return hasPermission(module, action) ? children : fallback;
};

export default ProtectedComponent;
