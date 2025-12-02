import { Router } from "express";
import { wsProxy } from "../middleware/proxy";

const collaborationRouter = Router();
const COLLABORATION_SERVICE_URL = process.env.COLLABORATION_SERVICE_BASE_URL!;
const wsCollaborationProxy = wsProxy(COLLABORATION_SERVICE_URL, '/socket/collaboration');

collaborationRouter.use(
    "/socket/collaboration",
    wsCollaborationProxy
);

export { collaborationRouter, wsCollaborationProxy };