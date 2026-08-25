import { Router } from "express";
import prisma from "../lib/prisma";
import { fetchStudyByNctId, importStudy } from "../lib/clinicaltrials";

const router = Router();

// Helpers for Express 5 type safety
function paramStr(val: string | string[]): string {
  return Array.isArray(val) ? val[0] : val;
}

function queryStr(val: unknown): string | undefined {
  if (typeof val === "string") return val;
  return undefined;
}

// ============================================================================
// PROTOCOLS — CRUD
// ============================================================================

// List protocols (with optional status filter and search)
router.get("/", async (req, res) => {
  const status = queryStr(req.query.status);
  const search = queryStr(req.query.search);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { shortTitle: { contains: search, mode: "insensitive" } },
      { fullTitle: { contains: search, mode: "insensitive" } },
      { protocolNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  const protocols = await prisma.protocol.findMany({
    where,
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      trialDesign: { select: { phase: true, studyType: true, blindingType: true } },
      _count: {
        select: {
          arms: true,
          endpoints: true,
          eligibilityCriteria: true,
          sections: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  res.json(protocols);
});

// Get single protocol with all nested data
router.get("/:id", async (req, res) => {
  const id = paramStr(req.params.id);

  const protocol = await prisma.protocol.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      trialDesign: true,
      objectives: { orderBy: { sortOrder: "asc" } },
      arms: {
        orderBy: { sortOrder: "asc" },
        include: { interventions: { include: { intervention: true } } },
      },
      interventions: true,
      eligibilityCriteria: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] },
      endpoints: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] },
      statisticalPlan: true,
      sections: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!protocol) {
    res.status(404).json({ error: "Protocol not found" });
    return;
  }

  res.json(protocol);
});

// Create protocol
router.post("/", async (req, res) => {
  const { protocolNumber, shortTitle, fullTitle, createdById, sponsorName, sponsorContact } = req.body;

  if (!protocolNumber || !shortTitle || !fullTitle || !createdById) {
    res.status(400).json({ error: "protocolNumber, shortTitle, fullTitle, and createdById are required" });
    return;
  }

  const protocol = await prisma.protocol.create({
    data: { protocolNumber, shortTitle, fullTitle, createdById, sponsorName, sponsorContact },
  });

  res.status(201).json(protocol);
});

// Update protocol
router.put("/:id", async (req, res) => {
  const id = paramStr(req.params.id);
  const { shortTitle, fullTitle, version, status, sponsorName, sponsorContact } = req.body;

  const protocol = await prisma.protocol.update({
    where: { id },
    data: {
      ...(shortTitle !== undefined && { shortTitle }),
      ...(fullTitle !== undefined && { fullTitle }),
      ...(version !== undefined && { version }),
      ...(status !== undefined && { status }),
      ...(sponsorName !== undefined && { sponsorName }),
      ...(sponsorContact !== undefined && { sponsorContact }),
    },
  });

  res.json(protocol);
});

// Delete protocol
router.delete("/:id", async (req, res) => {
  const id = paramStr(req.params.id);
  await prisma.protocol.delete({ where: { id } });
  res.status(204).send();
});

// ============================================================================
// IMPORT from ClinicalTrials.gov
// ============================================================================

router.post("/import/:nctId", async (req, res) => {
  const nctId = paramStr(req.params.nctId);
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ error: "userId is required in request body" });
    return;
  }

  const study = await fetchStudyByNctId(nctId);
  if (!study) {
    res.status(404).json({ error: `Study ${nctId} not found on ClinicalTrials.gov` });
    return;
  }

  const protocol = await importStudy(study, userId);
  res.status(201).json(protocol);
});

// ============================================================================
// TRIAL DESIGN (1:1 with protocol)
// ============================================================================

router.get("/:id/design", async (req, res) => {
  const protocolId = paramStr(req.params.id);

  const design = await prisma.trialDesign.findUnique({
    where: { protocolId },
  });

  if (!design) {
    res.status(404).json({ error: "Trial design not found" });
    return;
  }

  res.json(design);
});

router.put("/:id/design", async (req, res) => {
  const protocolId = paramStr(req.params.id);

  const design = await prisma.trialDesign.upsert({
    where: { protocolId },
    update: req.body,
    create: { protocolId, ...req.body },
  });

  res.json(design);
});

// ============================================================================
// OBJECTIVES (1:N)
// ============================================================================

router.get("/:id/objectives", async (req, res) => {
  const protocolId = paramStr(req.params.id);

  const objectives = await prisma.objective.findMany({
    where: { protocolId },
    include: { endpoints: true },
    orderBy: { sortOrder: "asc" },
  });

  res.json(objectives);
});

router.post("/:id/objectives", async (req, res) => {
  const protocolId = paramStr(req.params.id);
  const { type, description, sortOrder } = req.body;

  const objective = await prisma.objective.create({
    data: { protocolId, type, description, sortOrder: sortOrder ?? 0 },
  });

  res.status(201).json(objective);
});

router.put("/:id/objectives/:oid", async (req, res) => {
  const oid = paramStr(req.params.oid);
  const { type, description, sortOrder } = req.body;

  const objective = await prisma.objective.update({
    where: { id: oid },
    data: {
      ...(type !== undefined && { type }),
      ...(description !== undefined && { description }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });

  res.json(objective);
});

router.delete("/:id/objectives/:oid", async (req, res) => {
  const oid = paramStr(req.params.oid);
  await prisma.objective.delete({ where: { id: oid } });
  res.status(204).send();
});

// ============================================================================
// STUDY ARMS (1:N)
// ============================================================================

router.get("/:id/arms", async (req, res) => {
  const protocolId = paramStr(req.params.id);

  const arms = await prisma.studyArm.findMany({
    where: { protocolId },
    include: { interventions: { include: { intervention: true } } },
    orderBy: { sortOrder: "asc" },
  });

  res.json(arms);
});

router.post("/:id/arms", async (req, res) => {
  const protocolId = paramStr(req.params.id);
  const { name, type, description, sortOrder, participantCount } = req.body;

  const arm = await prisma.studyArm.create({
    data: {
      protocolId,
      name,
      type,
      description,
      sortOrder: sortOrder ?? 0,
      participantCount,
    },
  });

  res.status(201).json(arm);
});

router.put("/:id/arms/:aid", async (req, res) => {
  const aid = paramStr(req.params.aid);
  const { name, type, description, sortOrder, participantCount } = req.body;

  const arm = await prisma.studyArm.update({
    where: { id: aid },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(description !== undefined && { description }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(participantCount !== undefined && { participantCount }),
    },
  });

  res.json(arm);
});

router.delete("/:id/arms/:aid", async (req, res) => {
  const aid = paramStr(req.params.aid);
  await prisma.studyArm.delete({ where: { id: aid } });
  res.status(204).send();
});

// ============================================================================
// INTERVENTIONS (1:N)
// ============================================================================

router.get("/:id/interventions", async (req, res) => {
  const protocolId = paramStr(req.params.id);

  const interventions = await prisma.intervention.findMany({
    where: { protocolId },
    include: { arms: { include: { arm: true } } },
  });

  res.json(interventions);
});

router.post("/:id/interventions", async (req, res) => {
  const protocolId = paramStr(req.params.id);
  const { name, type, description, dose, frequency, route, duration, manufacturer, complianceMonitoring, armIds } = req.body;

  const intervention = await prisma.intervention.create({
    data: {
      protocolId,
      name,
      type,
      description,
      dose,
      frequency,
      route,
      duration,
      manufacturer,
      complianceMonitoring,
      ...(armIds && {
        arms: {
          create: (armIds as string[]).map((armId: string) => ({ armId })),
        },
      }),
    },
    include: { arms: { include: { arm: true } } },
  });

  res.status(201).json(intervention);
});

router.put("/:id/interventions/:iid", async (req, res) => {
  const iid = paramStr(req.params.iid);
  const { name, type, description, dose, frequency, route, duration, manufacturer, complianceMonitoring, armIds } = req.body;

  // If armIds provided, replace all arm links
  if (armIds) {
    await prisma.armIntervention.deleteMany({ where: { interventionId: iid } });
    await prisma.armIntervention.createMany({
      data: (armIds as string[]).map((armId: string) => ({
        armId,
        interventionId: iid,
      })),
    });
  }

  const intervention = await prisma.intervention.update({
    where: { id: iid },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(description !== undefined && { description }),
      ...(dose !== undefined && { dose }),
      ...(frequency !== undefined && { frequency }),
      ...(route !== undefined && { route }),
      ...(duration !== undefined && { duration }),
      ...(manufacturer !== undefined && { manufacturer }),
      ...(complianceMonitoring !== undefined && { complianceMonitoring }),
    },
    include: { arms: { include: { arm: true } } },
  });

  res.json(intervention);
});

router.delete("/:id/interventions/:iid", async (req, res) => {
  const iid = paramStr(req.params.iid);
  await prisma.intervention.delete({ where: { id: iid } });
  res.status(204).send();
});

// ============================================================================
// ELIGIBILITY CRITERIA (1:N)
// ============================================================================

router.get("/:id/criteria", async (req, res) => {
  const protocolId = paramStr(req.params.id);
  const type = queryStr(req.query.type);

  const where: Record<string, unknown> = { protocolId };
  if (type) where.type = type;

  const criteria = await prisma.eligibilityCriterion.findMany({
    where,
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });

  res.json(criteria);
});

router.post("/:id/criteria", async (req, res) => {
  const protocolId = paramStr(req.params.id);
  const { type, description, sortOrder, category } = req.body;

  const criterion = await prisma.eligibilityCriterion.create({
    data: {
      protocolId,
      type,
      description,
      sortOrder: sortOrder ?? 0,
      category,
    },
  });

  res.status(201).json(criterion);
});

router.put("/:id/criteria/:cid", async (req, res) => {
  const cid = paramStr(req.params.cid);
  const { type, description, sortOrder, category } = req.body;

  const criterion = await prisma.eligibilityCriterion.update({
    where: { id: cid },
    data: {
      ...(type !== undefined && { type }),
      ...(description !== undefined && { description }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(category !== undefined && { category }),
    },
  });

  res.json(criterion);
});

router.delete("/:id/criteria/:cid", async (req, res) => {
  const cid = paramStr(req.params.cid);
  await prisma.eligibilityCriterion.delete({ where: { id: cid } });
  res.status(204).send();
});

// ============================================================================
// ENDPOINTS (1:N)
// ============================================================================

router.get("/:id/endpoints", async (req, res) => {
  const protocolId = paramStr(req.params.id);
  const type = queryStr(req.query.type);

  const where: Record<string, unknown> = { protocolId };
  if (type) where.type = type;

  const endpoints = await prisma.endpoint.findMany({
    where,
    include: { objective: { select: { id: true, type: true, description: true } } },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });

  res.json(endpoints);
});

router.post("/:id/endpoints", async (req, res) => {
  const protocolId = paramStr(req.params.id);
  const { type, description, objectiveId, sortOrder, measurementMethod, timeframe, statisticalTest } = req.body;

  const endpoint = await prisma.endpoint.create({
    data: {
      protocolId,
      type,
      description,
      objectiveId,
      sortOrder: sortOrder ?? 0,
      measurementMethod,
      timeframe,
      statisticalTest,
    },
  });

  res.status(201).json(endpoint);
});

router.put("/:id/endpoints/:eid", async (req, res) => {
  const eid = paramStr(req.params.eid);
  const { type, description, objectiveId, sortOrder, measurementMethod, timeframe, statisticalTest } = req.body;

  const endpoint = await prisma.endpoint.update({
    where: { id: eid },
    data: {
      ...(type !== undefined && { type }),
      ...(description !== undefined && { description }),
      ...(objectiveId !== undefined && { objectiveId }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(measurementMethod !== undefined && { measurementMethod }),
      ...(timeframe !== undefined && { timeframe }),
      ...(statisticalTest !== undefined && { statisticalTest }),
    },
  });

  res.json(endpoint);
});

router.delete("/:id/endpoints/:eid", async (req, res) => {
  const eid = paramStr(req.params.eid);
  await prisma.endpoint.delete({ where: { id: eid } });
  res.status(204).send();
});

// ============================================================================
// STATISTICAL PLAN (1:1)
// ============================================================================

router.get("/:id/stats", async (req, res) => {
  const protocolId = paramStr(req.params.id);

  const plan = await prisma.statisticalPlan.findUnique({
    where: { protocolId },
  });

  if (!plan) {
    res.status(404).json({ error: "Statistical plan not found" });
    return;
  }

  res.json(plan);
});

router.put("/:id/stats", async (req, res) => {
  const protocolId = paramStr(req.params.id);

  const plan = await prisma.statisticalPlan.upsert({
    where: { protocolId },
    update: req.body,
    create: { protocolId, ...req.body },
  });

  res.json(plan);
});

// ============================================================================
// PROTOCOL SECTIONS (1:N, keyed by sectionCode)
// ============================================================================

router.get("/:id/sections", async (req, res) => {
  const protocolId = paramStr(req.params.id);

  const sections = await prisma.protocolSection.findMany({
    where: { protocolId },
    orderBy: { sortOrder: "asc" },
  });

  res.json(sections);
});

router.post("/:id/sections", async (req, res) => {
  const protocolId = paramStr(req.params.id);
  const { sectionCode, title, content, sortOrder, isComplete } = req.body;

  const section = await prisma.protocolSection.create({
    data: {
      protocolId,
      sectionCode,
      title,
      content,
      sortOrder: sortOrder ?? 0,
      isComplete: isComplete ?? false,
    },
  });

  res.status(201).json(section);
});

router.put("/:id/sections/:sid", async (req, res) => {
  const sid = paramStr(req.params.sid);
  const { title, content, sortOrder, isComplete } = req.body;

  const section = await prisma.protocolSection.update({
    where: { id: sid },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isComplete !== undefined && { isComplete }),
    },
  });

  res.json(section);
});

export default router;
