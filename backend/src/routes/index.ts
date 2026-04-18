import { Router, type IRouter } from "express";
import healthRouter from "./health";
import resumeRevampRouter from "./resumeRevamp";
import authRouter from "./auth";
import highlightsRouter from "./highlights";
import onboardingRouter from "./onboarding";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/resume-revamp", resumeRevampRouter);
router.use("/auth", authRouter);
router.use("/highlights", highlightsRouter);
router.use("/onboarding", onboardingRouter);

export default router;
