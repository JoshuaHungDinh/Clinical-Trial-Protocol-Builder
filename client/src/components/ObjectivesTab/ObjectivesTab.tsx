import { Objective, ObjectiveType, formatEnum } from "../../types/protocol";
import "./ObjectivesTab.scss";

interface ObjectivesTabProps {
  objectives: Objective[];
}

const TYPE_ORDER: ObjectiveType[] = ["PRIMARY", "SECONDARY", "EXPLORATORY"];

export function ObjectivesTab({ objectives }: ObjectivesTabProps) {
  if (objectives.length === 0) {
    return <p className="objectives-tab__empty">No objectives defined.</p>;
  }

  return (
    <div className="objectives-tab">
      {TYPE_ORDER.map((type) => {
        const group = objectives.filter((o) => o.type === type);
        if (group.length === 0) return null;

        return (
          <div key={type} className="objectives-tab__group">
            <h3 className="objectives-tab__group-title">{formatEnum(type)}</h3>
            <ul className="objectives-tab__list">
              {group
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((obj) => (
                  <li key={obj.id} className="objectives-tab__item">
                    {obj.description}
                  </li>
                ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
