import { Router } from "express";
import { verifyAccessToken, authorizedRoles, attachUserFromJwt } from "../middleware/jwt";
import { httpProxy } from "../middleware/proxy";
import { UserRole } from "shared";

const router = Router();
const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_BASE_URL!;

router.get(
  "/api/question",
  verifyAccessToken,
  authorizedRoles([UserRole.USER, UserRole.ADMIN]),
  attachUserFromJwt,
  httpProxy(QUESTION_SERVICE_URL)
);

router.post(
  "/api/question",
  verifyAccessToken,
  authorizedRoles([UserRole.ADMIN]),
  attachUserFromJwt,
  httpProxy(QUESTION_SERVICE_URL)
);

router.put(
  "/api/question/:id",
  verifyAccessToken,
  authorizedRoles([UserRole.ADMIN]),
  attachUserFromJwt,
  httpProxy(QUESTION_SERVICE_URL)
);

router.delete(
  "/api/question/:id",
  verifyAccessToken,
  authorizedRoles([UserRole.ADMIN]),
  attachUserFromJwt,
  httpProxy(QUESTION_SERVICE_URL)
);

export { router as questionRouter };
