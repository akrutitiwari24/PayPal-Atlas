/**
 * Shared TypeScript contracts for PayPal Atlas.
 * Source of truth: Section 5 ("Core data shapes") of PayPal_Atlas_7_Day_Plan.pdf.
 */

// ============================================================================
// 1. Rule
// ============================================================================

export type RuleOperation = 'payout' | 'collect';

export type RuleEffect = 'block' | 'condition' | 'allow';

/**
 * Filter criteria specifying when a rule is applicable to a payment step.
 * All criteria are optional; unspecified criteria match any step.
 */
export interface RuleAppliesTo {
  /** Country code of the sender/payer (e.g., 'US', 'DE') */
  sender_country?: string;
  /** Country code of the recipient/payee (e.g., 'IN', 'SG', 'BR') */
  recipient_country?: string;
  /** Currency code (e.g., 'USD', 'INR', 'EUR', 'SGD') */
  currency?: string;
  /** Indicates whether the rule applies when currency conversion is involved */
  conversion?: boolean;
}

/**
 * Deterministic rule definition verified against official PayPal documentation.
 */
export interface Rule {
  /** Unique identifier for the rule (e.g., 'R-CONV-IN') */
  id: string;
  /** Operation type the rule applies to ('payout' or 'collect') */
  operation: RuleOperation;
  /** Matching criteria for step attributes */
  applies_to: RuleAppliesTo;
  /** Enforcement effect when the rule matches */
  effect: RuleEffect;
  /** Human-readable explanation or constraint reason */
  message: string;
  /** Direct URL to official PayPal documentation verifying the rule */
  source_url: string;
  /** ISO date string or timestamp indicating when the documentation was retrieved */
  retrieved_at: string;
}

// ============================================================================
// 2. Verdict
// ============================================================================

export type VerdictStatus = 'supported' | 'conditional' | 'unsupported' | 'unknown';

/**
 * Eligibility evaluation produced by the deterministic rules engine for a step.
 */
export interface Verdict {
  /** Overall feasibility status */
  status: VerdictStatus;
  /** Rule IDs that actively block the step from executing */
  blocking_rule_ids: string[];
  /** Rule IDs that attach conditions or prerequisites to the step */
  condition_rule_ids: string[];
  /** Supporting rule objects providing evidence and citations for UI and audit */
  evidence: Rule[];
}

// ============================================================================
// 4. State (Lifecycle state machine for a Step)
// ============================================================================

/**
 * Lifecycle states of an execution step:
 * drafted -> approved -> initiated -> pending -> completed | failed | cancelled | needs_reassessment
 */
export type State =
  | 'drafted'
  | 'approved'
  | 'initiated'
  | 'pending'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'needs_reassessment';

// ============================================================================
// 3. Step
// ============================================================================

export type StepKind = 'collect' | 'payout';

/**
 * Map of PayPal-assigned identifiers captured during checkout or payout execution.
 * Accommodates order IDs, capture IDs, payout batch IDs, and payout item IDs.
 */
export interface StepPayPalIds {
  order_id?: string;
  capture_id?: string;
  payout_batch_id?: string;
  payout_item_id?: string;
  [key: string]: string | undefined;
}

/**
 * An individual payment collection or payout step in a cross-border plan.
 */
export interface Step {
  /** Unique identifier for the step */
  id: string;
  /** Identifier of the plan this step belongs to */
  plan_id: string;
  /** Kind of operation ('collect' for Orders API or 'payout' for Payouts API) */
  kind: StepKind;
  /** Monetary amount for the transaction */
  amount: number;
  /** Currency code (e.g., 'EUR', 'SGD', 'USD') */
  currency: string;
  /** Country code of the counterparty (buyer or recipient) */
  counterparty_country: string;
  /** Step IDs that must successfully complete before this step can execute */
  depends_on: string[];
  /** Eligibility verdict evaluated by the rules engine */
  verdict: Verdict;
  /** Current lifecycle/execution state */
  state: State;
  /** PayPal identifiers associated with this step across its execution */
  paypal_ids: StepPayPalIds;
  /** Flag indicating if this step's execution or failure is simulated (labeled SIMULATED in UI) */
  simulated: boolean;
}

// ============================================================================
// 5. Event
// ============================================================================

export type EventActor = 'user' | 'atlas' | 'paypal';

/**
 * Audit trail entry recording actions, approvals, state transitions, or external responses.
 */
export interface Event {
  /** Timestamp of the event (ISO date string or epoch timestamp) */
  ts: string | number;
  /** Plan version number at the time the event was recorded */
  plan_version: number;
  /** Type of event (e.g., 'plan_created', 'step_approved', 'capture_completed', 'replan_triggered') */
  type: string;
  /** Identifier of the step this event is associated with */
  step_id: string;
  /** Rule IDs cited or evaluated in connection with this event */
  rule_ids: string[];
  /** Optional PayPal identifier if the event involves a PayPal transaction */
  paypal_id?: string;
  /** Initiator of the event: human user, atlas agent/engine, or PayPal API/webhook */
  actor: EventActor;
  /** Description or structured payload providing additional event details */
  detail: string | Record<string, unknown>;
}

