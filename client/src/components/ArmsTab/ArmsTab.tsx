import { StudyArm, formatEnum } from "../../types/protocol";
import "./ArmsTab.scss";

interface ArmsTabProps {
  arms: StudyArm[];
}

export function ArmsTab({ arms }: ArmsTabProps) {
  if (arms.length === 0) {
    return <p className="arms-tab__empty">No study arms defined.</p>;
  }

  return (
    <div className="arms-tab">
      {arms
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((arm) => (
          <div key={arm.id} className="arms-tab__card">
            <div className="arms-tab__card-header">
              <h3 className="arms-tab__arm-name">{arm.name}</h3>
              <span className={`arms-tab__arm-type arms-tab__arm-type--${arm.type.toLowerCase()}`}>
                {formatEnum(arm.type)}
              </span>
            </div>

            {arm.description && (
              <p className="arms-tab__description">{arm.description}</p>
            )}

            {arm.participantCount && (
              <p className="arms-tab__participants">
                Target: {arm.participantCount} participants
              </p>
            )}

            {arm.interventions.length > 0 && (
              <div className="arms-tab__interventions">
                <h4 className="arms-tab__interventions-title">Interventions</h4>
                {arm.interventions.map((ai) => (
                  <div key={ai.id} className="arms-tab__intervention">
                    <div className="arms-tab__intervention-header">
                      <span className="arms-tab__intervention-name">
                        {ai.intervention.name}
                      </span>
                      <span className="arms-tab__intervention-type">
                        {formatEnum(ai.intervention.type)}
                      </span>
                    </div>
                    <dl className="arms-tab__intervention-details">
                      {ai.intervention.dose && (
                        <>
                          <dt>Dose</dt>
                          <dd>{ai.intervention.dose}</dd>
                        </>
                      )}
                      {ai.intervention.frequency && (
                        <>
                          <dt>Frequency</dt>
                          <dd>{ai.intervention.frequency}</dd>
                        </>
                      )}
                      {ai.intervention.route && (
                        <>
                          <dt>Route</dt>
                          <dd>{ai.intervention.route}</dd>
                        </>
                      )}
                      {ai.intervention.duration && (
                        <>
                          <dt>Duration</dt>
                          <dd>{ai.intervention.duration}</dd>
                        </>
                      )}
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
