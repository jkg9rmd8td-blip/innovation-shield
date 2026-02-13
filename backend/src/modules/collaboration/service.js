import { pool } from "../../db/pool.js";
import { pushAuditLog } from "../audit/service.js";
import { createNotification } from "../notification/service.js";

function cleanText(value) {
  return String(value || "").trim();
}

function cleanMention(value) {
  const raw = cleanText(value);
  if (!raw) return null;
  return raw.startsWith("@") ? raw : `@${raw}`;
}

function mentionUserId(mention) {
  if (!mention) return null;
  return mention.replace(/^@/, "").trim() || null;
}

function parseLimit(value, fallback = 60) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.round(n), 1), 300);
}

async function insertActivity({ initiativeId, prototypeId, activityType, message, payload, actorId, actorName }) {
  const { rows } = await pool.query(
    `INSERT INTO v2.prototype_collaboration_activities (initiative_id, prototype_id, activity_type, message, payload, actor_id, actor_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id,
               initiative_id AS "initiativeId",
               prototype_id AS "prototypeId",
               activity_type AS "activityType",
               message,
               payload,
               actor_id AS "actorId",
               actor_name AS "actorName",
               created_at AS "createdAt"`,
    [initiativeId, prototypeId || null, activityType, message, payload ? JSON.stringify(payload) : null, actorId || null, actorName || null]
  );
  return rows[0];
}

export async function listCollaborationStream(initiativeId, { prototypeId = null, limit = 60 } = {}) {
  const cleanInitiativeId = cleanText(initiativeId);
  if (!cleanInitiativeId) {
    const err = new Error("INITIATIVE_ID_REQUIRED");
    err.statusCode = 400;
    err.code = "INITIATIVE_ID_REQUIRED";
    throw err;
  }

  const cappedLimit = parseLimit(limit);

  const commentsParams = [cleanInitiativeId];
  const activitiesParams = [cleanInitiativeId];

  let commentsWhere = "initiative_id = $1";
  let activitiesWhere = "initiative_id = $1";

  if (prototypeId) {
    commentsParams.push(prototypeId);
    commentsWhere += ` AND (prototype_id = $${commentsParams.length} OR prototype_id IS NULL)`;

    activitiesParams.push(prototypeId);
    activitiesWhere += ` AND (prototype_id = $${activitiesParams.length} OR prototype_id IS NULL)`;
  }

  commentsParams.push(cappedLimit);
  activitiesParams.push(cappedLimit);

  const [comments, activities] = await Promise.all([
    pool.query(
      `SELECT id,
              initiative_id AS "initiativeId",
              prototype_id AS "prototypeId",
              author_id AS "authorId",
              author_name AS "authorName",
              mention,
              comment_text AS "commentText",
              source,
              created_at AS "createdAt"
         FROM v2.prototype_collaboration_comments
        WHERE ${commentsWhere}
        ORDER BY created_at DESC
        LIMIT $${commentsParams.length}`,
      commentsParams
    ),
    pool.query(
      `SELECT id,
              initiative_id AS "initiativeId",
              prototype_id AS "prototypeId",
              activity_type AS "activityType",
              message,
              payload,
              actor_id AS "actorId",
              actor_name AS "actorName",
              created_at AS "createdAt"
         FROM v2.prototype_collaboration_activities
        WHERE ${activitiesWhere}
        ORDER BY created_at DESC
        LIMIT $${activitiesParams.length}`,
      activitiesParams
    ),
  ]);

  return {
    initiativeId: cleanInitiativeId,
    prototypeId: prototypeId || null,
    comments: comments.rows,
    activities: activities.rows,
  };
}

export async function addCollaborationComment(initiativeId, payload, user) {
  const cleanInitiativeId = cleanText(initiativeId);
  if (!cleanInitiativeId) {
    const err = new Error("INITIATIVE_ID_REQUIRED");
    err.statusCode = 400;
    err.code = "INITIATIVE_ID_REQUIRED";
    throw err;
  }

  const commentText = cleanText(payload?.commentText);
  if (!commentText) {
    const err = new Error("COMMENT_REQUIRED");
    err.statusCode = 400;
    err.code = "COMMENT_REQUIRED";
    throw err;
  }

  const mention = cleanMention(payload?.mention);
  const prototypeId = cleanText(payload?.prototypeId) || null;
  const authorId = user?.id || cleanText(payload?.authorId) || null;
  const authorName = user?.name || cleanText(payload?.authorName) || "Portal User";

  const { rows } = await pool.query(
    `INSERT INTO v2.prototype_collaboration_comments (initiative_id, prototype_id, author_id, author_name, mention, comment_text, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id,
               initiative_id AS "initiativeId",
               prototype_id AS "prototypeId",
               author_id AS "authorId",
               author_name AS "authorName",
               mention,
               comment_text AS "commentText",
               source,
               created_at AS "createdAt"`,
    [cleanInitiativeId, prototypeId, authorId, authorName, mention, commentText, payload?.source || "portal"]
  );

  const comment = rows[0];

  const activity = await insertActivity({
    initiativeId: cleanInitiativeId,
    prototypeId,
    activityType: "comment_added",
    message: mention ? `New comment ${mention}` : "New collaboration comment",
    payload: { commentId: comment.id, mention, commentText },
    actorId: authorId,
    actorName: authorName,
  });

  if (mention) {
    const userId = mentionUserId(mention);
    if (userId) {
      await createNotification({
        userId,
        channel: "in_app",
        title: "تمت الإشارة إليك في تعاون النموذج",
        body: `${authorName} أضاف تعليقًا: ${commentText.slice(0, 120)}`,
      });
    }
  }

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "COLLABORATION_COMMENT_ADD",
    operation: "create",
    entityId: cleanInitiativeId,
    afterState: { comment, activity },
  });

  return { comment, activity };
}

export async function addCollaborationActivity(initiativeId, payload, user) {
  const cleanInitiativeId = cleanText(initiativeId);
  if (!cleanInitiativeId) {
    const err = new Error("INITIATIVE_ID_REQUIRED");
    err.statusCode = 400;
    err.code = "INITIATIVE_ID_REQUIRED";
    throw err;
  }

  const message = cleanText(payload?.message);
  if (!message) {
    const err = new Error("MESSAGE_REQUIRED");
    err.statusCode = 400;
    err.code = "MESSAGE_REQUIRED";
    throw err;
  }

  const activity = await insertActivity({
    initiativeId: cleanInitiativeId,
    prototypeId: cleanText(payload?.prototypeId) || null,
    activityType: cleanText(payload?.activityType) || "update",
    message,
    payload: payload?.payload || null,
    actorId: user?.id || cleanText(payload?.actorId) || null,
    actorName: user?.name || cleanText(payload?.actorName) || "Portal User",
  });

  await pushAuditLog({
    userId: user?.id,
    userName: user?.name,
    userRole: user?.role,
    action: "COLLABORATION_ACTIVITY_ADD",
    operation: "create",
    entityId: cleanInitiativeId,
    afterState: activity,
  });

  return activity;
}
