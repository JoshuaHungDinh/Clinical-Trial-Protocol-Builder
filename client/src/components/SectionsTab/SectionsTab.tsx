import { useState } from "react";
import { ProtocolSection } from "../../types/protocol";
import "./SectionsTab.scss";

interface SectionsTabProps {
  sections: ProtocolSection[];
}

export function SectionsTab({ sections }: SectionsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    sections[0]?.id ?? null
  );

  if (sections.length === 0) {
    return <p className="sections-tab__empty">No sections defined.</p>;
  }

  const toggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="sections-tab">
      {sections
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((section) => (
          <div
            key={section.id}
            className={`sections-tab__item ${expandedId === section.id ? "sections-tab__item--expanded" : ""}`}
          >
            <button
              className="sections-tab__header"
              onClick={() => toggle(section.id)}
            >
              <span className={`sections-tab__status ${section.isComplete ? "sections-tab__status--complete" : ""}`}>
                {section.isComplete ? "✓" : "○"}
              </span>
              <span className="sections-tab__code">{section.sectionCode}</span>
              <span className="sections-tab__title">{section.title}</span>
              <span className="sections-tab__chevron">
                {expandedId === section.id ? "▾" : "▸"}
              </span>
            </button>

            {expandedId === section.id && (
              <div className="sections-tab__content">
                {renderContent(section.content)}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}

function renderContent(content: Record<string, unknown> | null): React.ReactNode {
  if (!content) return <p className="sections-tab__no-content">No content yet.</p>;

  // Handle { text: "..." } format (most common)
  if (typeof content.text === "string") {
    return (
      <div className="sections-tab__text">
        {(content.text as string).split("\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    );
  }

  // Handle { conditions: [...] } format
  if (Array.isArray(content.conditions)) {
    return (
      <ul className="sections-tab__conditions">
        {(content.conditions as string[]).map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    );
  }

  // Fallback: render as JSON
  return (
    <pre className="sections-tab__json">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}
