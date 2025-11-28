import { Router } from "express";
import { verifyAccessToken, authorizedRoles, attachUserFromJwt } from "../middleware/jwt";
import { httpProxy, wsProxy } from "../middleware/proxy";
import { UserRole } from "shared";

const matchRouter = Router();
const MATCHING_SERVICE_URL = process.env.MATCHING_SERVICE_BASE_URL!;
const wsMatchingProxy = wsProxy(MATCHING_SERVICE_URL, '/socket/matching');

matchRouter.post(
    "/api/match/start",
    verifyAccessToken,
    authorizedRoles([UserRole.USER, UserRole.ADMIN]),
    attachUserFromJwt,
    httpProxy(MATCHING_SERVICE_URL),
);

matchRouter.use(
    "/socket/matching",
    wsMatchingProxy
)

export { matchRouter, wsMatchingProxy };