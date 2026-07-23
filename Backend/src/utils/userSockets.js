export const userSockets = new Map();

/*
Structure:

userSockets = Map<
  userId,
  {
    sockets: Set<socketId>,
    orgs: Set<orgId>,
    orgMembers: Set<orgMemberId>,
    projects: Set<projectId>,
    tasks: Set<taskId>
  }
>
*/