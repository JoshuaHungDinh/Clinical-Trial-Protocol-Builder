import { TrialDesign, formatEnum } from "../../types/protocol";
import "./OverviewTab.scss";

interface OverviewTabProps {
  trialDesign: TrialDesign | null;
}

export function OverviewTab({ trialDesign }: OverviewTabProps) {
  if (!trialDesign) {
    return <p className="overview-tab__empty">No trial design configured.</p>;
  }

  const d = trialDesign;

  return (
    <div className="overview-tab">
      <div className="overview-tab__grid">
        <Section title="Study Design">
          <Field label="Study Type" value={formatEnum(d.studyType)} />
          <Field label="Phase" value={formatEnum(d.phase)} />
          <Field label="Blinding" value={formatEnum(d.blindingType)} />
          <Field label="Control Type" value={d.controlType ? formatEnum(d.controlType) : "—"} />
          <Field label="Randomization" value={formatEnum(d.randomizationType)} />
          {d.allocationRatio && <Field label="Allocation Ratio" value={d.allocationRatio} />}
        </Section>

        <Section title="Enrollment">
          <Field label="Number of Arms" value={d.numberOfArms} />
          <Field label="Estimated Enrollment" value={d.estimatedEnrollment ?? "—"} />
        </Section>

        <Section title="Duration">
          <Field label="Study Duration" value={d.studyDurationMonths ? `${d.studyDurationMonths} months` : "—"} />
          <Field label="Treatment Duration" value={d.treatmentDurationWeeks ? `${d.treatmentDurationWeeks} weeks` : "—"} />
          <Field label="Follow-Up Duration" value={d.followUpDurationWeeks ? `${d.followUpDurationWeeks} weeks` : "—"} />
        </Section>

        <Section title="Sites">
          <Field label="Multicenter" value={d.multicenter ? "Yes" : "No"} />
          {d.numberOfSites && <Field label="Number of Sites" value={d.numberOfSites} />}
          {d.countries.length > 0 && <Field label="Countries" value={d.countries.join(", ")} />}
        </Section>

        {d.adaptiveDesign && (
          <Section title="Adaptive Design">
            <Field label="Adaptive" value="Yes" />
            {d.adaptiveDesignDetails && <Field label="Details" value={d.adaptiveDesignDetails} />}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overview-tab__section">
      <h3 className="overview-tab__section-title">{title}</h3>
      <dl className="overview-tab__fields">{children}</dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <>
      <dt className="overview-tab__label">{label}</dt>
      <dd className="overview-tab__value">{value}</dd>
    </>
  );
}
