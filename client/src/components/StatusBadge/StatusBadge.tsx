import { ProtocolStatus, formatEnum } from "../../types/protocol";
import "./StatusBadge.scss";

interface StatusBadgeProps {
  status: ProtocolStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${status.toLowerCase()}`}>
      {formatEnum(status)}
    </span>
  );
}
