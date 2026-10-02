"use client";

import { useState } from "react";
import type { DimensionKey, FamilyPreferences } from "@/lib/types";
import { programFields } from "../../scripts/majors";

type Props = {
  open: boolean;
  preferences: FamilyPreferences;
  onSave: (prefs: FamilyPreferences) => void;
  onClose: () => void;
};

type PriorityKey = "costValue" | "careerOutcomes" | "academicPrestige";

const priorities: { key: PriorityKey; label: string; description: string }[] = [
  { key: "costValue", label: "Cost & Value", description: "Affordable net price, low debt, strong financial aid" },
  { key: "careerOutcomes", label: "Career Outcomes", description: "High post-graduation earnings, strong programs in your interests" },
  { key: "academicPrestige", label: "Academic Prestige", description: "Selectivity, test scores, graduation rates, academic rigor" },
];

function priorityToWeights(selected: Set<PriorityKey>): Record<DimensionKey, number> {
  const weights: Record<DimensionKey, number> = {
    academicRigor: 50,
    careerOutcomes: 50,
    financialValue: 50,
    safetyWellbeing: 50,
    campusLifeCulture: 50,
    locationEnvironment: 50,
    programStrength: 50,
  };

  if (selected.has("costValue")) {
    weights.financialValue = 85;
  }
  if (selected.has("careerOutcomes")) {
    weights.careerOutcomes = 85;
    weights.programStrength = 75;
  }
  if (selected.has("academicPrestige")) {
    weights.academicRigor = 85;
  }

  return weights;
}

function weightsToPriorities(weights: Record<DimensionKey, number>): Set<PriorityKey> {
  const selected = new Set<PriorityKey>();
  if (weights.financialValue > 60) selected.add("costValue");
  if (weights.careerOutcomes > 60) selected.add("careerOutcomes");
  if (weights.academicRigor > 60) selected.add("academicPrestige");
  return selected;
}

export default function PreferencesModal({ open, preferences, onSave, onClose }: Props) {
  const [selectedPriorities, setSelectedPriorities] = useState<Set<PriorityKey>>(
    () => weightsToPriorities(preferences.weights)
  );
  const [interests, setInterests] = useState<string[]>([...preferences.interests]);
  const [homeLabel, setHomeLabel] = useState(preferences.homeLabel);
  const [homeLatitude, setHomeLatitude] = useState(preferences.homeLatitude);
  const [homeLongitude, setHomeLongitude] = useState(preferences.homeLongitude);

  if (!open) return null;

  const togglePriority = (key: PriorityKey) => {
    setSelectedPriorities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleInterest = (key: string) => {
    setInterests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = () => {
    onSave({
      weights: priorityToWeights(selectedPriorities),
      interests,
      homeLabel,
      homeLatitude,
      homeLongitude,
    });
    onClose();
  };

  return (
    <section className="prefs-modal" aria-label="Family preferences">
      <div className="prefs-backdrop" onClick={onClose} />
      <div className="prefs-panel" role="dialog" aria-modal="true">
        <div className="prefs-header">
          <div>
            <h2>Set Your Priorities</h2>
            <p className="meta">What matters most to your family?</p>
          </div>
          <button type="button" className="ghost" onClick={onClose}>Close</button>
        </div>

        <div className="prefs-body">
          <section className="prefs-section">
            <h3>What matters most?</h3>
            <p className="meta">Select one or more priorities</p>
            <div className="priority-toggles">
              {priorities.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={`priority-toggle ${selectedPriorities.has(p.key) ? "active" : ""}`}
                  onClick={() => togglePriority(p.key)}
                >
                  <strong>{p.label}</strong>
                  <span>{p.description}</span>
                </button>
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
                  className={`interest-chip ${interests.includes(field.key) ? "active" : ""}`}
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
                value={homeLabel}
                onChange={(e) => setHomeLabel(e.target.value)}
              />
              <div className="prefs-coords">
                <input
                  type="number"
                  placeholder="Latitude"
                  step="0.01"
                  value={homeLatitude ?? ""}
                  onChange={(e) => setHomeLatitude(e.target.value ? Number(e.target.value) : null)}
                />
                <input
                  type="number"
                  placeholder="Longitude"
                  step="0.01"
                  value={homeLongitude ?? ""}
                  onChange={(e) => setHomeLongitude(e.target.value ? Number(e.target.value) : null)}
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
