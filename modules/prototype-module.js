import { composeMiddleware } from "../guards/middleware.js";
import { withAudit } from "../services/audit-service.js";
import {
  listPrototypeWorkspaces,
  getPrototypeWorkspace,
  setPrototypeScope,
  usePrototypeTemplate,
  addPrototypeTask,
  updatePrototypeTask,
  addPrototypeFile,
  addPrototypeNote,
  generatePrototypeAISuggestions,
  evaluatePrototypeQuality,
  requestPrototypeSupport,
  managePrototypeSupport,
  listPrototypeTemplates,
  listPrototypeTaskTypes,
  listPrototypeQualityRubric,
} from "../services/prototype-service.js";

const pipeline = composeMiddleware([
  async (ctx, next) => next(),
]);

export function listPrototypeWorkspacesFlow() {
  return listPrototypeWorkspaces();
}

export function getPrototypeWorkspaceFlow(initiativeId) {
  return getPrototypeWorkspace(initiativeId);
}

export function listPrototypeTemplatesFlow() {
  return listPrototypeTemplates();
}

export function listPrototypeTaskTypesFlow() {
  return listPrototypeTaskTypes();
}

export function listPrototypeQualityRubricFlow() {
  return listPrototypeQualityRubric();
}

export async function setPrototypeScopeFlow(ctx) {
  return pipeline(
    ctx,
    withAudit(async (innerCtx) => {
      const result = setPrototypeScope(innerCtx.user, innerCtx.initiativeId, innerCtx.scope);
      innerCtx.action = result.action;
      innerCtx.operation = "prototype_scope_set";
      innerCtx.before = result.before;
      innerCtx.after = result.after;
      innerCtx.entityId = innerCtx.initiativeId;
      return result;
    })
  );
}

export async function usePrototypeTemplateFlow(ctx) {
  return pipeline(
    ctx,
    withAudit(async (innerCtx) => {
      const result = usePrototypeTemplate(innerCtx.user, innerCtx.initiativeId, innerCtx.templateKey);
      innerCtx.action = result.action;
      innerCtx.operation = "prototype_template_used";
      innerCtx.before = result.before;
      innerCtx.after = result.after;
      innerCtx.entityId = innerCtx.initiativeId;
      return result;
    })
  );
}

export async function addPrototypeTaskFlow(ctx) {
  return pipeline(
    ctx,
    withAudit(async (innerCtx) => {
      const result = addPrototypeTask(innerCtx.user, innerCtx.initiativeId, innerCtx.payload);
      innerCtx.action = result.action;
      innerCtx.operation = "prototype_task_create";
      innerCtx.before = result.before;
      innerCtx.after = result.after;
      innerCtx.entityId = innerCtx.initiativeId;
      return result;
    })
  );
}

export async function updatePrototypeTaskFlow(ctx) {
  return pipeline(
    ctx,
    withAudit(async (innerCtx) => {
      const result = updatePrototypeTask(innerCtx.user, innerCtx.initiativeId, innerCtx.taskId, innerCtx.patch);
      innerCtx.action = result.action;
      innerCtx.operation = "prototype_task_update";
      innerCtx.before = result.before;
      innerCtx.after = result.after;
      innerCtx.entityId = innerCtx.initiativeId;
      return result;
    })
  );
}

export async function addPrototypeFileFlow(ctx) {
  return pipeline(
    ctx,
    withAudit(async (innerCtx) => {
      const result = addPrototypeFile(innerCtx.user, innerCtx.initiativeId, innerCtx.payload);
      innerCtx.action = result.action;
      innerCtx.operation = "prototype_file_add";
      innerCtx.before = result.before;
      innerCtx.after = result.after;
      innerCtx.entityId = innerCtx.initiativeId;
      return result;
    })
  );
}

export async function addPrototypeNoteFlow(ctx) {
  return pipeline(
    ctx,
    withAudit(async (innerCtx) => {
      const result = addPrototypeNote(innerCtx.user, innerCtx.initiativeId, innerCtx.text);
      innerCtx.action = result.action;
      innerCtx.operation = "prototype_note_add";
      innerCtx.before = result.before;
      innerCtx.after = result.after;
      innerCtx.entityId = innerCtx.initiativeId;
      return result;
    })
  );
}

export async function generatePrototypeAISuggestionsFlow(ctx) {
  return pipeline(
    ctx,
    withAudit(async (innerCtx) => {
      const result = generatePrototypeAISuggestions(innerCtx.user, innerCtx.initiativeId);
      innerCtx.action = result.action;
      innerCtx.operation = "prototype_ai_advice";
      innerCtx.before = result.before;
      innerCtx.after = result.after;
      innerCtx.entityId = innerCtx.initiativeId;
      return result;
    })
  );
}

export async function evaluatePrototypeQualityFlow(ctx) {
  return pipeline(
    ctx,
    withAudit(async (innerCtx) => {
      const result = evaluatePrototypeQuality(innerCtx.user, innerCtx.initiativeId, innerCtx.marks);
      innerCtx.action = result.action;
      innerCtx.operation = "prototype_quality_evaluate";
      innerCtx.before = result.before;
      innerCtx.after = result.after;
      innerCtx.entityId = innerCtx.initiativeId;
      return result;
    })
  );
}

export async function requestPrototypeSupportFlow(ctx) {
  return pipeline(
    ctx,
    withAudit(async (innerCtx) => {
      const result = requestPrototypeSupport(innerCtx.user, innerCtx.initiativeId, innerCtx.payload);
      innerCtx.action = result.action;
      innerCtx.operation = "prototype_support_request";
      innerCtx.before = result.before;
      innerCtx.after = result.after;
      innerCtx.entityId = innerCtx.initiativeId;
      return result;
    })
  );
}

export async function managePrototypeSupportFlow(ctx) {
  return pipeline(
    ctx,
    withAudit(async (innerCtx) => {
      const result = managePrototypeSupport(innerCtx.user, innerCtx.initiativeId, innerCtx.payload);
      innerCtx.action = result.action;
      innerCtx.operation = "prototype_support_manage";
      innerCtx.before = result.before;
      innerCtx.after = result.after;
      innerCtx.entityId = innerCtx.initiativeId;
      return result;
    })
  );
}
