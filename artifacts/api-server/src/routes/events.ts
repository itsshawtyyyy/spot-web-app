import { and, asc, eq, gte } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  createEventSchema,
  eventCategorySchema,
  eventIdSchema,
  updateEventSchema,
} from "@workspace/api-zod";
import { db, events } from "@workspace/db";

const router: IRouter = Router();

function sendValidationError(res: Response, error: { flatten: () => unknown }) {
  return res.status(400).json({
    message: "Invalid request data",
    issues: error.flatten(),
  });
}

function requireAdminToken(req: Request, res: Response): boolean {
  const expectedToken = process.env.ADMIN_API_TOKEN;
  if (!expectedToken) {
    res.status(503).json({ message: "Event publishing is not configured" });
    return false;
  }

  if (req.header("x-admin-token") !== expectedToken) {
    res.status(401).json({ message: "Authentication required" });
    return false;
  }

  return true;
}

router.get("/events", async (req, res, next) => {
  const category = req.query.category;
  const categoryFilter =
    typeof category === "string"
      ? eventCategorySchema.safeParse(category)
      : null;

  if (category && !categoryFilter?.success) {
    return res.status(400).json({ message: "Invalid event category" });
  }

  try {
    const now = new Date().toISOString();
    const where = categoryFilter?.success
      ? and(eq(events.category, categoryFilter.data), gte(events.startsAt, now))
      : gte(events.startsAt, now);
    const result = await db
      .select()
      .from(events)
      .where(where)
      .orderBy(asc(events.startsAt));
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.get("/events/:id", async (req, res, next) => {
  const id = eventIdSchema.safeParse(req.params.id);
  if (!id.success) return sendValidationError(res, id.error);

  try {
    const [event] = await db.select().from(events).where(eq(events.id, id.data));
    if (!event) return res.status(404).json({ message: "Event not found" });
    return res.json(event);
  } catch (error) {
    return next(error);
  }
});

router.post("/events", async (req, res, next) => {
  if (!requireAdminToken(req, res)) return;
  const input = createEventSchema.safeParse(req.body);
  if (!input.success) return sendValidationError(res, input.error);

  try {
    const [event] = await db.insert(events).values(input.data).returning();
    return res.status(201).json(event);
  } catch (error) {
    return next(error);
  }
});

router.patch("/events/:id", async (req, res, next) => {
  if (!requireAdminToken(req, res)) return;
  const id = eventIdSchema.safeParse(req.params.id);
  if (!id.success) return sendValidationError(res, id.error);

  const input = updateEventSchema.safeParse(req.body);
  if (!input.success) return sendValidationError(res, input.error);

  try {
    const [event] = await db
      .update(events)
      .set({ ...input.data, updatedAt: new Date().toISOString() })
      .where(eq(events.id, id.data))
      .returning();
    if (!event) return res.status(404).json({ message: "Event not found" });
    return res.json(event);
  } catch (error) {
    return next(error);
  }
});

export default router;
