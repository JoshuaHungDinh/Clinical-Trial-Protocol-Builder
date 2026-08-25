import { StatisticalPlan, formatEnum } from "../../types/protocol";
import "./StatsTab.scss";

interface StatsTabProps {
  stats: StatisticalPlan | null;
}

export function StatsTab({ stats }: StatsTabProps) {
  if (!stats) {
    return <p className="stats-tab__empty">No statistical plan configured.</p>;
  }

  return (
    <div className="stats-tab">
      <div className="stats-tab__grid">
        <Section title="Sample Size">
          <Field label="Total" value={stats.sampleSizeTotal ?? "—"} />
          {stats.sampleSizeJustification && (
            <div className="stats-tab__text-block">
              <dt className="stats-tab__label">Justification</dt>
              <dd className="stats-tab__value">{stats.sampleSizeJustification}</dd>
            </div>
          )}
        </Section>

        {stats.powerCalculation && (
          <Section title="Power Calculation">
            {Object.entries(stats.powerCalculation).map(([key, val]) => (
              <Field key={key} label={formatEnum(key)} value={String(val)} />
            ))}
          </Section>
        )}

        <Section title="Analysis">
          <Field label="Significance Level" value={stats.significanceLevel ?? "—"} />
          {stats.primaryAnalysisMethod && (
            <div className="stats-tab__text-block">
              <dt className="stats-tab__label">Primary Method</dt>
              <dd className="stats-tab__value">{stats.primaryAnalysisMethod}</dd>
            </div>
          )}
          {stats.secondaryAnalysisMethods && (
            <div className="stats-tab__text-block">
              <dt className="stats-tab__label">Secondary Methods</dt>
              <dd className="stats-tab__value">{stats.secondaryAnalysisMethods}</dd>
            </div>
          )}
        </Section>

        {stats.analysisPopulations.length > 0 && (
          <Section title="Analysis Populations">
            <div className="stats-tab__badges">
              {stats.analysisPopulations.map((pop) => (
                <span key={pop} className="stats-tab__badge">
                  {formatEnum(pop)}
                </span>
              ))}
            </div>
          </Section>
        )}

        {stats.interimAnalyses && (
          <Section title="Interim Analyses">
            {Object.entries(stats.interimAnalyses).map(([key, val]) => (
              <Field key={key} label={formatEnum(key)} value={String(val)} />
            ))}
          </Section>
        )}

        {(stats.missingDataHandling || stats.multiplicity) && (
          <Section title="Additional Methods">
            {stats.missingDataHandling && (
              <div className="stats-tab__text-block">
                <dt className="stats-tab__label">Missing Data</dt>
                <dd className="stats-tab__value">{stats.missingDataHandling}</dd>
              </div>
            )}
            {stats.multiplicity && (
              <div className="stats-tab__text-block">
                <dt className="stats-tab__label">Multiplicity</dt>
                <dd className="stats-tab__value">{stats.multiplicity}</dd>
              </div>
            )}
          </Section>
        )}

        {(stats.subgroupAnalyses || stats.sensitivityAnalyses) && (
          <Section title="Subgroup & Sensitivity">
            {stats.subgroupAnalyses && (
              <div className="stats-tab__text-block">
                <dt className="stats-tab__label">Subgroup Analyses</dt>
                <dd className="stats-tab__value">{stats.subgroupAnalyses}</dd>
              </div>
            )}
            {stats.sensitivityAnalyses && (
              <div className="stats-tab__text-block">
                <dt className="stats-tab__label">Sensitivity Analyses</dt>
                <dd className="stats-tab__value">{stats.sensitivityAnalyses}</dd>
              </div>
            )}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="stats-tab__section">
      <h3 className="stats-tab__section-title">{title}</h3>
      <dl className="stats-tab__fields">{children}</dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <>
      <dt className="stats-tab__label">{label}</dt>
      <dd className="stats-tab__value">{value}</dd>
    </>
  );
}
