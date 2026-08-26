import { Endpoint, EndpointType, formatEnum } from "../../types/protocol";
import "./EndpointsTab.scss";

interface EndpointsTabProps {
  endpoints: Endpoint[];
}

const TYPE_ORDER: EndpointType[] = ["PRIMARY", "SECONDARY", "EXPLORATORY", "SAFETY"];

export function EndpointsTab({ endpoints }: EndpointsTabProps) {
  if (endpoints.length === 0) {
    return <p className="endpoints-tab__empty">No endpoints defined.</p>;
  }

  return (
    <div className="endpoints-tab">
      {TYPE_ORDER.map((type) => {
        const group = endpoints.filter((e) => e.type === type);
        if (group.length === 0) return null;

        return (
          <div key={type} className="endpoints-tab__group">
            <h3 className="endpoints-tab__group-title">
              {formatEnum(type)}
              <span className="endpoints-tab__count">{group.length}</span>
            </h3>
            <div className="endpoints-tab__list">
              {group
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((ep) => (
                  <div key={ep.id} className="endpoints-tab__item">
                    <p className="endpoints-tab__description">{ep.description}</p>
                    <dl className="endpoints-tab__details">
                      {ep.measurementMethod && (
                        <>
                          <dt>Measurement</dt>
                          <dd>{ep.measurementMethod}</dd>
                        </>
                      )}
                      {ep.timeframe && (
                        <>
                          <dt>Timeframe</dt>
                          <dd>{ep.timeframe}</dd>
                        </>
                      )}
                      {ep.statisticalTest && (
                        <>
                          <dt>Statistical Test</dt>
                          <dd>{ep.statisticalTest}</dd>
                        </>
                      )}
                    </dl>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
