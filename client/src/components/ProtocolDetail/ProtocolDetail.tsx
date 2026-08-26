import { Link, useParams } from "react-router-dom";
import { useProtocol } from "../../hooks/useProtocol";
import { ProtocolHeader } from "../ProtocolHeader/ProtocolHeader";
import { TabView } from "../TabView/TabView";
import { OverviewTab } from "../OverviewTab/OverviewTab";
import { ObjectivesTab } from "../ObjectivesTab/ObjectivesTab";
import { ArmsTab } from "../ArmsTab/ArmsTab";
import { EligibilityTab } from "../EligibilityTab/EligibilityTab";
import { EndpointsTab } from "../EndpointsTab/EndpointsTab";
import { StatsTab } from "../StatsTab/StatsTab";
import { SectionsTab } from "../SectionsTab/SectionsTab";
import "./ProtocolDetail.scss";

export function ProtocolDetail() {
  const { id } = useParams<{ id: string }>();
  const { protocol, loading, error } = useProtocol(id!);

  if (loading) {
    return <div className="protocol-detail__loading">Loading protocol...</div>;
  }

  if (error) {
    return (
      <div className="protocol-detail__error">
        <p>{error}</p>
        <Link to="/">Back to protocols</Link>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="protocol-detail__error">
        <p>Protocol not found.</p>
        <Link to="/">Back to protocols</Link>
      </div>
    );
  }

  const tabs = [
    {
      key: "overview",
      label: "Overview",
      content: <OverviewTab trialDesign={protocol.trialDesign} />,
    },
    {
      key: "objectives",
      label: `Objectives (${protocol.objectives.length})`,
      content: <ObjectivesTab objectives={protocol.objectives} />,
    },
    {
      key: "arms",
      label: `Arms (${protocol.arms.length})`,
      content: <ArmsTab arms={protocol.arms} />,
    },
    {
      key: "eligibility",
      label: `Eligibility (${protocol.eligibilityCriteria.length})`,
      content: <EligibilityTab criteria={protocol.eligibilityCriteria} />,
    },
    {
      key: "endpoints",
      label: `Endpoints (${protocol.endpoints.length})`,
      content: <EndpointsTab endpoints={protocol.endpoints} />,
    },
    {
      key: "stats",
      label: "Statistical Plan",
      content: <StatsTab stats={protocol.statisticalPlan} />,
    },
    {
      key: "sections",
      label: `Sections (${protocol.sections.length})`,
      content: <SectionsTab sections={protocol.sections} />,
    },
  ];

  return (
    <div className="protocol-detail">
      <Link to="/" className="protocol-detail__back">
        ← Back to protocols
      </Link>
      <ProtocolHeader protocol={protocol} />
      <TabView tabs={tabs} />
    </div>
  );
}
