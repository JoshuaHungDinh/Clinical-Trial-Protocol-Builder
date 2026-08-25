import { Protocol } from "../../types/protocol";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import "./ProtocolHeader.scss";

interface ProtocolHeaderProps {
  protocol: Protocol;
}

export function ProtocolHeader({ protocol }: ProtocolHeaderProps) {
  return (
    <div className="protocol-header">
      <div className="protocol-header__top">
        <span className="protocol-header__number">{protocol.protocolNumber}</span>
        <StatusBadge status={protocol.status} />
        <span className="protocol-header__version">v{protocol.version}</span>
      </div>
      <h1 className="protocol-header__title">{protocol.fullTitle}</h1>
      <div className="protocol-header__meta">
        {protocol.sponsorName && (
          <span className="protocol-header__sponsor">
            Sponsor: {protocol.sponsorName}
          </span>
        )}
        <span className="protocol-header__creator">
          Created by: {protocol.createdBy.firstName} {protocol.createdBy.lastName}
        </span>
      </div>
    </div>
  );
}
