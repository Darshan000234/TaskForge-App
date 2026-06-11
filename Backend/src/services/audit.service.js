import prisma  from "../config/prisma.js";

export class AuditService {
     
  async log({
    orgId        = null,
    proj_id      = null,
    userId       = null,
    action,
    resourceType,
    resourceId,
    oldValue     = null,
    newValue     = null,
    metadata     = null,
  }) {
    try {
      await prisma.auditLog.create({
        data: {
          orgId,
          proj_id,
          userId,
          action,
          resourceType,
          resourceId:  String(resourceId),
          oldValue:    oldValue  ?? undefined,
          newValue:    newValue  ?? undefined,
          metadata:    metadata  ?? undefined,
        },
      });
    } catch (err) {
      console.error("[AuditService] Failed to write log:", err.message, {
        orgId, proj_id, userId, action, resourceType, resourceId,
      });
    }
  }

   
  async query({
    orgId,
    proj_id,
    action,
    userId,
    resourceType,
    resourceId,
    from,
    to,
    cursor,
    limit = 20,
  }) {
    const safeLimit = Math.min(Number(limit) || 20, 100);
    const where = {
    ...(orgId  && { orgId }),
    ...(proj_id && { proj_id }),
    ...(action && { action }),
    ...(userId !== undefined && userId !== null && { userId: Number(userId) }),
    ...(resourceType && { resourceType }),
    ...(resourceId && { resourceId: String(resourceId) }),
    ...((from || to) && {
      createdAt: {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      },
    }),
  };

    const logs = await prisma.AuditLog.findMany({
      take:    safeLimit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const hasMore    = logs.length > safeLimit;
    const page_slice = hasMore ? logs.slice(0, safeLimit) : logs;
    const nextCursor = hasMore ? page_slice[page_slice.length - 1].id : null;

    return { logs: page_slice, nextCursor, hasMore };
  }
}

export const auditService = new AuditService();