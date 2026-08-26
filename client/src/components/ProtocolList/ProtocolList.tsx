import { useState } from "react";
import { Link } from "react-router-dom";
import { useProtocols } from "../../hooks/useProtocols";
import { ProtocolStatus, formatEnum } from "../../types/protocol";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import { SearchBar } from "../SearchBar/SearchBar";
import "./ProtocolList.scss";

const STATUS_OPTIONS: ProtocolStatus[] = [
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "ACTIVE",
  "COMPLETED",
  "TERMINATED",
  "SUSPENDED",
  "WITHDRAWN",
];

export function ProtocolList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProtocolStatus | undefined>();
  const { protocols, loading, error } = useProtocols({ search, status: statusFilter });

  return (
    <div className="protocol-list">
      <div className="protocol-list__header">
        <h2>Protocols</h2>
        <span className="protocol-list__count">
          {!loading && `${protocols.length} studies`}
        </span>
      </div>

      <div className="protocol-list__filters">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by title or protocol number..."
        />
        <select
          className="protocol-list__status-filter"
          value={statusFilter ?? ""}
          onChange={(e) =>
            setStatusFilter(
              e.target.value ? (e.target.value as ProtocolStatus) : undefined
            )
          }
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {formatEnum(s)}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="protocol-list__error">{error}</div>}

      {loading ? (
        <div className="protocol-list__loading">Loading protocols...</div>
      ) : protocols.length === 0 ? (
        <div className="protocol-list__empty">No protocols found.</div>
      ) : (
        <div className="protocol-list__table-wrapper">
          <table className="protocol-list__table">
            <thead>
              <tr>
                <th>Protocol #</th>
                <th>Title</th>
                <th>Phase</th>
                <th>Status</th>
                <th>Sponsor</th>
                <th>Arms</th>
                <th>Endpoints</th>
              </tr>
            </thead>
            <tbody>
              {protocols.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/protocols/${p.id}`} className="protocol-list__link">
                      {p.protocolNumber}
                    </Link>
                  </td>
                  <td className="protocol-list__title-cell">
                    <Link to={`/protocols/${p.id}`} className="protocol-list__link">
                      {p.shortTitle}
                    </Link>
                  </td>
                  <td>{p.trialDesign ? formatEnum(p.trialDesign.phase) : "—"}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>{p.sponsorName ?? "—"}</td>
                  <td>{p._count.arms}</td>
                  <td>{p._count.endpoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
