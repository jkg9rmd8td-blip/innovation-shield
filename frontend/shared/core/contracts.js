/**
 * @typedef {{ id: string, name: string, role: string, department?: string }} User
 * @typedef {{ id: string, title: string, ownerId: string, stage: string, status: string, createdAt: string, updatedAt: string }} Initiative
 * @typedef {{ id: string, initiativeId: string, judgeId: string, score: number, createdAt: string }} JudgingScore
 * @typedef {{ id: string, initiativeId: string, status: string, progress: number, createdAt: string }} Prototype
 * @typedef {{ id: string, userId?: string, action: string, operation: string, createdAt: string }} AuditLog
 */
export {};
