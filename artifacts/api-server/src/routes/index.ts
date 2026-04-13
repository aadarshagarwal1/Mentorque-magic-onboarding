import { Router, type IRouter } from "express";
import healthRouter from "./health";
import resumeRevampRouter from "./resumeRevamp";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/resume-revamp", resumeRevampRouter);

export default router;
