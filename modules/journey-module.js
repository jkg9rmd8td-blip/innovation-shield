import { listInitiativesFlow, moveInitiativeStageFlow } from "./initiative-module.js";
import { JOURNEY_STAGES } from "../core/constants.js";

export function listJourneyStagesFlow() {
  return JOURNEY_STAGES;
}

export function listJourneyItemsFlow() {
  return listInitiativesFlow();
}

export async function updateJourneyStageFlow(ctx) {
  return moveInitiativeStageFlow(ctx);
}
