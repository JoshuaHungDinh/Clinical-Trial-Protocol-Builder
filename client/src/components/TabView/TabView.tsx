import { useState } from "react";
import "./TabView.scss";

interface Tab {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface TabViewProps {
  tabs: Tab[];
  defaultTab?: string;
}

export function TabView({ tabs, defaultTab }: TabViewProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.key ?? "");

  const activeContent = tabs.find((t) => t.key === activeTab)?.content;

  return (
    <div className="tab-view">
      <nav className="tab-view__nav" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`tab-view__tab ${activeTab === tab.key ? "tab-view__tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="tab-view__content" role="tabpanel">
        {activeContent}
      </div>
    </div>
  );
}
