import { EligibilityCriterion } from "../../types/protocol";
import "./EligibilityTab.scss";

interface EligibilityTabProps {
  criteria: EligibilityCriterion[];
}

export function EligibilityTab({ criteria }: EligibilityTabProps) {
  const inclusion = criteria
    .filter((c) => c.type === "INCLUSION")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const exclusion = criteria
    .filter((c) => c.type === "EXCLUSION")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (criteria.length === 0) {
    return <p className="eligibility-tab__empty">No eligibility criteria defined.</p>;
  }

  return (
    <div className="eligibility-tab">
      <div className="eligibility-tab__columns">
        <div className="eligibility-tab__column">
          <h3 className="eligibility-tab__heading eligibility-tab__heading--inclusion">
            Inclusion Criteria
            <span className="eligibility-tab__count">{inclusion.length}</span>
          </h3>
          <ol className="eligibility-tab__list">
            {inclusion.map((c) => (
              <li key={c.id} className="eligibility-tab__item">
                {c.category && (
                  <span className="eligibility-tab__category">{c.category}</span>
                )}
                {c.description}
              </li>
            ))}
          </ol>
        </div>

        <div className="eligibility-tab__column">
          <h3 className="eligibility-tab__heading eligibility-tab__heading--exclusion">
            Exclusion Criteria
            <span className="eligibility-tab__count">{exclusion.length}</span>
          </h3>
          <ol className="eligibility-tab__list">
            {exclusion.map((c) => (
              <li key={c.id} className="eligibility-tab__item">
                {c.category && (
                  <span className="eligibility-tab__category">{c.category}</span>
                )}
                {c.description}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
