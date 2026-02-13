import { listInitiativesFlow } from "./initiative-module.js";
import { buildExecutiveImpact } from "../services/impact-engine-service.js";

export function getExecutiveImpactFlow() {
  const initiatives = listInitiativesFlow();
  return buildExecutiveImpact(initiatives);
}
