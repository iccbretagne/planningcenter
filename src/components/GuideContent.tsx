"use client";

import { useState } from "react";
import ScreenshotPlaceholder from "@/components/ui/ScreenshotPlaceholder";

type RoleKey = "SUPER_ADMIN" | "ADMIN" | "SECRETARY" | "MINISTER" | "DEPARTMENT_HEAD";

interface GuideContentProps {
  defaultRole: RoleKey;
}

const ROLE_LABELS: Record<RoleKey, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  SECRETARY: "Secrétaire",
  MINISTER: "Ministre",
  DEPARTMENT_HEAD: "Resp. Département",
};

const ROLE_DESCRIPTIONS: Record<RoleKey, string> = {
  SUPER_ADMIN: "Accès complet à toutes les fonctionnalités et toutes les églises.",
  ADMIN: "Gestion complète d'une église : planning, membres, départements et événements.",
  SECRETARY: "Vision globale en lecture avec gestion des événements.",
  MINISTER: "Gestion du planning et des membres pour les départements de son ministère.",
  DEPARTMENT_HEAD: "Gestion du planning et des membres pour ses départements assignés.",
};

type AccessLevel = "edit" | "read" | "none";

interface Feature {
  name: string;
  category: string;
  screenshotTitle: string;
  screenshotDescription?: string;
  access: Record<RoleKey, AccessLevel>;
}

const FEATURES: Feature[] = [
  {
    name: "Voir le planning",
    category: "Planning",
    screenshotTitle: "Vue planning",
    screenshotDescription: "Grille de planning avec les STAR et leurs statuts de service",
    access: { SUPER_ADMIN: "edit", ADMIN: "edit", SECRETARY: "read", MINISTER: "edit", DEPARTMENT_HEAD: "edit" },
  },
  {
    name: "Modifier le planning",
    category: "Planning",
    screenshotTitle: "Édition du planning",
    screenshotDescription: "Modification des statuts de service des STAR",
    access: { SUPER_ADMIN: "edit", ADMIN: "edit", SECRETARY: "none", MINISTER: "edit", DEPARTMENT_HEAD: "edit" },
  },
  {
    name: "Voir les membres (STAR)",
    category: "Membres",
    screenshotTitle: "Liste des STAR",
    screenshotDescription: "Tableau des membres avec leurs départements et statuts",
    access: { SUPER_ADMIN: "edit", ADMIN: "edit", SECRETARY: "read", MINISTER: "edit", DEPARTMENT_HEAD: "edit" },
  },
  {
    name: "Gérer les membres (STAR)",
    category: "Membres",
    screenshotTitle: "Gestion des STAR",
    screenshotDescription: "Ajout, modification et suppression de membres",
    access: { SUPER_ADMIN: "edit", ADMIN: "edit", SECRETARY: "none", MINISTER: "edit", DEPARTMENT_HEAD: "edit" },
  },
  {
    name: "Voir les événements",
    category: "Événements",
    screenshotTitle: "Liste des événements",
    screenshotDescription: "Calendrier et liste des événements planifiés",
    access: { SUPER_ADMIN: "edit", ADMIN: "edit", SECRETARY: "edit", MINISTER: "read", DEPARTMENT_HEAD: "read" },
  },
  {
    name: "Gérer les événements",
    category: "Événements",
    screenshotTitle: "Gestion des événements",
    screenshotDescription: "Création, modification et suppression d'événements",
    access: { SUPER_ADMIN: "edit", ADMIN: "edit", SECRETARY: "edit", MINISTER: "none", DEPARTMENT_HEAD: "none" },
  },
  {
    name: "Gérer les départements",
    category: "Administration",
    screenshotTitle: "Gestion des départements",
    screenshotDescription: "Configuration des départements et ministères",
    access: { SUPER_ADMIN: "edit", ADMIN: "edit", SECRETARY: "none", MINISTER: "edit", DEPARTMENT_HEAD: "none" },
  },
  {
    name: "Gérer l'église",
    category: "Administration",
    screenshotTitle: "Paramètres de l'église",
    screenshotDescription: "Configuration générale de l'église",
    access: { SUPER_ADMIN: "edit", ADMIN: "none", SECRETARY: "none", MINISTER: "none", DEPARTMENT_HEAD: "none" },
  },
  {
    name: "Gérer les utilisateurs",
    category: "Administration",
    screenshotTitle: "Gestion des utilisateurs",
    screenshotDescription: "Attribution des rôles et permissions",
    access: { SUPER_ADMIN: "edit", ADMIN: "none", SECRETARY: "none", MINISTER: "none", DEPARTMENT_HEAD: "none" },
  },
];

const ROLES: RoleKey[] = ["SUPER_ADMIN", "ADMIN", "SECRETARY", "MINISTER", "DEPARTMENT_HEAD"];

function AccessBadge({ level }: { level: AccessLevel }) {
  switch (level) {
    case "edit":
      return <span className="inline-flex items-center text-sm text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✓ Édition</span>;
    case "read":
      return <span className="inline-flex items-center text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">👁 Lecture</span>;
    case "none":
      return <span className="inline-flex items-center text-sm text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">✗ Pas d&apos;accès</span>;
  }
}

export default function GuideContent({ defaultRole }: GuideContentProps) {
  const [activeRole, setActiveRole] = useState<RoleKey>(defaultRole);

  const categories = Array.from(new Set(FEATURES.map((f) => f.category)));

  return (
    <div>
      {/* Onglets par rôle */}
      <div className="flex overflow-x-auto gap-1 border-b border-gray-200 mb-6 pb-px -mx-1 px-1">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-t-lg transition-colors shrink-0 ${
              activeRole === role
                ? "bg-icc-violet text-white"
                : "text-gray-600 hover:text-icc-violet hover:bg-gray-50"
            }`}
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
      </div>

      {/* Description du rôle */}
      <div className="mb-6 p-4 bg-icc-violet/5 border border-icc-violet/20 rounded-lg">
        <h2 className="text-lg font-semibold text-icc-violet">{ROLE_LABELS[activeRole]}</h2>
        <p className="text-sm text-gray-600 mt-1">{ROLE_DESCRIPTIONS[activeRole]}</p>
        {activeRole === "MINISTER" && (
          <p className="text-xs text-gray-500 mt-2 italic">
            * Le ministre a accès uniquement aux départements de son ministère assigné.
          </p>
        )}
      </div>

      {/* Fonctionnalités par catégorie */}
      <div className="space-y-8">
        {categories.map((category) => (
          <section key={category}>
            <h3 className="text-base font-semibold text-gray-800 mb-4 border-b pb-2">{category}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURES.filter((f) => f.category === category).map((feature) => (
                <div key={feature.name} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-gray-700">{feature.name}</h4>
                    <AccessBadge level={feature.access[activeRole]} />
                  </div>
                  {feature.access[activeRole] !== "none" && (
                    <ScreenshotPlaceholder
                      title={feature.screenshotTitle}
                      description={feature.screenshotDescription}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
