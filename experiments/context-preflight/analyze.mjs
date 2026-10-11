/**
 * Experimental, read-only candidate-gap triage for VALIDATED Intentacle task records.
 * No sources are fetched, no items/unknowns are added, and no inference is treated as fact.
 * The rules are a finite audit checklist, not autonomous requirements discovery.
 */
const checks = [
  {
    id: "success-evidence",
    priority: "high",
    applies: "always",
    question:
      "What observable outcome demonstrates that the requested change works for its intended user?",
    inspect: [
      "acceptance criteria",
      "user journey",
      "repeatable test or measurement",
    ],
    mentions: /acceptance|success criteria|verified|measur|test(?:ed|s|ing)?/i,
  },
  {
    id: "bounds-and-regressions",
    priority: "medium",
    applies: "always",
    question:
      "Which existing behavior and explicit non-goals must remain unchanged?",
    inspect: [
      "current product contract",
      "adjacent flows",
      "existing regression tests",
    ],
    mentions: /unchanged|backwards.compatib|regress|non.goals?|out.of.scope/i,
  },
  {
    id: "interaction-states",
    priority: "high",
    applies: "interactive",
    question:
      "What states, transitions, and invalid interactions must the UI support?",
    inspect: ["rendered component", "event handlers", "state-transition tests"],
    mentions:
      /state|transition|on.off|place|remove|drag|rotate|stop|start|reset/i,
  },
  {
    id: "interaction-accessibility",
    priority: "high",
    applies: "interactive",
    question:
      "Can the interaction be completed with keyboard, touch, and assistive technology?",
    inspect: [
      "keyboard operation",
      "focus states",
      "accessible controls",
      "touch interaction",
    ],
    mentions: /keyboard|screen.reader|accessib|touch|focus|aria/i,
  },
  {
    id: "interaction-responsive",
    priority: "medium",
    applies: "interactive",
    question:
      "What happens on narrow screens, reduced-motion settings, and interrupted interactions?",
    inspect: [
      "mobile viewport",
      "reduced-motion behavior",
      "interruption recovery",
    ],
    mentions: /mobile|tablet|responsiv|reduced.motion|interrupt|small.screen/i,
  },
  {
    id: "payment-authorization",
    priority: "high",
    applies: "financial",
    question:
      "What authorizes each financial action, and which party owns the resulting money or obligation?",
    inspect: [
      "payment ownership contract",
      "approval and entitlement rules",
      "backend authorization",
    ],
    mentions: /authoriz|consent|approv|direct.charge|ownership/i,
  },
  {
    id: "payment-reconciliation",
    priority: "high",
    applies: "financial",
    question:
      "How are retries, duplicated events, partial completion, refunds, and ledger reconciliation handled?",
    inspect: [
      "webhook handlers",
      "idempotency keys",
      "ledger invariants",
      "test-mode failure scenarios",
    ],
    mentions:
      /idempoten|duplicate|refund|reconcil|partial.payment|webhook|retry/i,
  },
  {
    id: "external-fetch-security",
    priority: "high",
    applies: "remote-url",
    question:
      "How are user-supplied URLs and redirects prevented from reaching private or untrusted destinations?",
    inspect: [
      "SSRF policy",
      "redirect validation",
      "DNS/IP rules",
      "timeouts and response limits",
    ],
    mentions: /ssrf|private.ip|redirect|dns|host.allowlist|url.validat/i,
  },
  {
    id: "external-evidence-scope",
    priority: "high",
    applies: "remote-url",
    question:
      "How does the result distinguish inspected facts from unvisited pages, failed fetches, and unknowns?",
    inspect: [
      "fetch scope",
      "error states",
      "evidence provenance",
      "claim confidence",
    ],
    mentions: /scope|unknown|provenance|confidence|crawl|page.level|evidence/i,
  },
];

const triggers = {
  interactive:
    /interactiv|click|tap|drag|drop|animate|animation|move (?:the |a )?(?:arm|needle|control)|toggle|playback|record player|button/i,
  financial:
    /pay(?:ment|able)?|invoice|refund|deposit|milestone|checkout|billing|stripe|charge|bank transfer/i,
  "remote-url":
    /(?:website|site|url|domain|webpage)\s+(?:checker|scanner|audit|inspection|analy[sz]er)|(?:check|scan|inspect|audit|fetch|crawl)\s+(?:a |the |any )?(?:site|website|url|domain|webpage)/i,
};

function active(item) {
  return (
    item.review?.state !== "rejected" &&
    (item.origin === "user_stated" ||
      item.review?.state === "confirmed" ||
      item.review?.state === "delegated")
  );
}

/** Input is a previously schema/provenance-validated TaskRecord. */
export function analyzeContextGaps(record) {
  const activeItems = record.items.filter(active);
  const scope = activeItems.map((i) => i.text).join("\n");
  const known = record.unknowns.filter((u) => u.status === "open");
  const families = Object.fromEntries(
    Object.entries(triggers).map(([id, re]) => [id, re.test(scope)]),
  );
  const suppliedDocs = record.references.filter(
    (r) => r.kind === "document" && r.availability === "supplied",
  );
  const candidates = checks
    .filter((c) => c.applies === "always" || families[c.applies])
    .map((c) => ({
      id: c.id,
      priority: c.priority,
      classification: "candidate_question_not_a_defect",
      question: c.question,
      request_mentions_topic: c.mentions.test(scope),
      proposed_inspection_targets: c.inspect,
      evidence_status: "not_verified_by_this_pilot",
    }));
  return {
    experiment: "context-gap-preflight-v0",
    task_id: record.task_id,
    task_revision: record.revision,
    discovered_families: Object.keys(families).filter((f) => families[f]),
    known_open_unknowns: known.map((u) => ({
      id: u.id,
      question: u.question,
      blocks: u.blocks,
      next_action: u.next_action,
    })),
    supplied_document_ids: suppliedDocs.map((r) => r.id),
    candidate_checks: candidates,
    limitations: [
      "This is a heuristic checklist, not an agent, code inspection, or proof of missing requirements.",
      "Source document content and locators are not executed or fetched; supplied documents are not fact-checked.",
      "Request mentions do not establish implementation or test coverage.",
      "No candidate is added to the task record or treated as authorized work.",
    ],
  };
}
