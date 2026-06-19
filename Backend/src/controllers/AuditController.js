import { auditService } from "../services/audit.service.js";
 
export const AuditData = async (req, res) => {
  try {
    
    const {
      orgId,
      action,
      resourceType,
      resourceId,
      from,
      to,
      cursor,
      limit,
      proj_id
    } = req.query;

    const result = await auditService.query({
      orgId : orgId ? Number(orgId) : null,
      proj_id: proj_id ? Number(proj_id) : null,
      action,
      resourceType,
      resourceId,
      from,
      to,
      cursor,
      limit
    });
    
    return res.status(200).json(result);

  } catch (error) {
    console.error("AuditData Error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch audit logs"
    });
  }
};
