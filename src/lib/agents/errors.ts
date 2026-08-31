// Thrown by agent steps when a hard dependency (LLM, search) is unavailable
// or fails. Callers must surface `reason` to the user rather than
// fabricating a result — see AgentRun.error.
export class AgentDependencyError extends Error {
  reason: string;

  constructor(reason: string) {
    super(reason);
    this.name = "AgentDependencyError";
    this.reason = reason;
  }
}
