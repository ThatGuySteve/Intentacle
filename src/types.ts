export const SCHEMA_VERSION = "0.1.0-draft" as const;
export const RENDERER_VERSION = "markdown/0.1.1" as const;

export type Step = "clarify" | "inspect" | "plan" | "execute";
export type Origin = "user_stated" | "source_reported" | "inferred" | "default";
export type ReviewState = "unreviewed" | "confirmed" | "delegated" | "rejected";
export type ItemKind =
  | "objective"
  | "context"
  | "constraint"
  | "success_criterion"
  | "output";

export interface Reference {
  id: string;
  kind: "user_request" | "user_answer" | "document";
  availability: "supplied" | "unavailable";
  content?: string;
  locator?: string;
  applies_to?: string[];
}

export interface Item {
  id: string;
  kind: ItemKind;
  text: string;
  origin: Origin;
  source_ids: string[];
  rationale?: string;
  strength?: "hard" | "preference";
  review: { state: ReviewState; source_id?: string };
}

export interface Unknown {
  id: string;
  question: string;
  necessity: "required" | "important" | "optional";
  blocks: Step[];
  next_action: "ask_user" | "inspect_source" | "offer_choices";
  status: "open" | "resolved";
  resolution?: { text: string; source_ids: string[] };
}

export interface Conflict {
  id: string;
  item_ids: string[];
  description: string;
  blocks: Step[];
  status: "open" | "resolved";
  resolution?: { note: string; source_id: string };
}

export interface TaskRecord {
  schema_version: typeof SCHEMA_VERSION;
  task_id: string;
  revision: number;
  next_step: Step;
  references: Reference[];
  items: Item[];
  unknowns: Unknown[];
  conflicts: Conflict[];
}

export interface Diagnostic {
  code: string;
  path: string;
  message: string;
}

export type ValidationResult =
  | { valid: true; record: TaskRecord; diagnostics: [] }
  | { valid: false; diagnostics: Diagnostic[] };

export interface Readiness {
  step: Step;
  blocked: boolean;
  blockers: { id: string; kind: "unknown" | "conflict"; reason: string }[];
}

export type Disposition = "active" | "proposed" | "rejected";
export interface RenderResult {
  markdown: string;
  manifest: {
    schema_version: typeof SCHEMA_VERSION;
    renderer_version: typeof RENDERER_VERSION;
    task_id: string;
    revision: number;
    readiness: Readiness;
    items: {
      id: string;
      disposition: Disposition;
      instruction_text_emitted: boolean;
    }[];
    reference_ids: string[];
    unknown_ids: string[];
    conflict_ids: string[];
  };
}
