"use client";

import { useState } from "react";
import type { DimensionKey, FamilyPreferences } from "@/lib/types";
import { dimensionLabels } from "@/lib/scoring";
import { programFields } from "../../scripts/majors";

type Props = {
  open: boolean;
  preferences: FamilyPreferences;
  onSave: (prefs: FamilyPreferences) => void;
  onClose: () => void;
};

const dimensionDescriptions: Record<DimensionKey, string> = {
  academicRigor: "Selectivity, test scores, retention, and graduation rates",
  careerOutcomes: "Post-graduation earnings and employment success",
  financialValue: "Net cost, aid availability, and debt levels",
  safetyWellbeing: "Campus safety, student support, and wellbeing",
  campusLifeCulture: "Campus size, class sizes, and student engagement",
  locationEnvironment: "Distance from home and campus setting",
  programStrength: "Strength in your areas of academic interest",
};

export default function PreferencesModal({ open, preferences, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<FamilyPreferences>({ ...preferences, weights: { ...preferences.weights }, interests: [...preferences.interests] });

  if (!open) return null;

  const setWeight = (key: DimensionKey, value: number) => {
    setDraft((prev) => ({ ...prev, weights: { ...prev.weights, [key]: value } }));
  };

  const toggleInterest = (key: string) => {
    setDraft((prev) => {
      const interests = prev.interests.includes(key)
        ? prev.interests.filter((k) => k !== key)
        : [...prev.interests, key];
      return { ...prev, interests };
    });
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <section className="prefs-modal" aria-label="Family preferences">
      <div className="prefs-backdrop" onClick={onClose} />
      <div className="prefs-panel" role="dialog" aria-modal="true">
        <div className="prefs-header">
          <div>
            <h2>What Matters to Your Family</h2>
            <p className="meta">Adjust these to personalize your school rankings</p>
          </div>
          <button type="button" className="ghost" onClick={onClose}>Close</button>
        </div>

        <div className="prefs-body">
          <section className="prefs-section">
            <h3>Priority Dimensions</h3>
            <p className="meta">Drag each slider to set how much this matters (0 = don&apos;t care, 100 = top priority)</p>
            <div className="prefs-sliders">
              {(Object.keys(dimensionLabels) as DimensionKey[]).map((key) => (
                <div key={key} className="pref-slider-row">
                  <div className="pref-slider-label">
                    <strong>{dimensionLabels[key]}</strong>
                    <span className="meta">{dimensionDescriptions[key]}</span>
                  </div>
                  <div className="pref-slider-control">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={draft.weights[key]}
                      onChange={(e) => setWeight(key, Number(e.target.value))}
                    />
                    <span className="pref-slider-value">{draft.weights[key]}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="prefs-section">
            <h3>Areas of Interest</h3>
            <p className="meta">Select the academic areas your student is interested in</p>
            <div className="prefs-interests">
              {programFields.map((field) => (
                <button
                  key={field.key}
                  type="button"
                  className={`interest-chip ${draft.interests.includes(field.key) ? "active" : ""}`}
                  onClick={() => toggleInterest(field.key)}
                >
                  {field.label}
                </button>
              ))}
            </div>
          </section>

          <section className="prefs-section">
            <h3>Home Location (Optional)</h3>
            <p className="meta">Used to calculate distance to each school</p>
            <div className="prefs-location">
              <input
                type="text"
                placeholder="e.g. Dallas, TX"
                value={draft.homeLabel}
                onChange={(e) => setDraft((prev) => ({ ...prev, homeLabel: e.target.value }))}
              />
              <div className="prefs-coords">
                <input
                  type="number"
                  placeholder="Latitude"
                  step="0.01"
                  value={draft.homeLatitude ?? ""}
                  onChange={(e) => setDraft((prev) => ({ ...prev, homeLatitude: e.target.value ? Number(e.target.value) : null }))}
                />
                <input
                  type="number"
                  placeholder="Longitude"
                  step="0.01"
                  value={draft.homeLongitude ?? ""}
                  onChange={(e) => setDraft((prev) => ({ ...prev, homeLongitude: e.target.value ? Number(e.target.value) : null }))}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="prefs-footer">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="prefs-save-btn" onClick={handleSave}>Save Preferences</button>
        </div>
      </div>
    </section>
  );
}
