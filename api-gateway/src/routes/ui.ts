import { Router } from "express";
import { httpProxy } from "../middleware/proxy";

const uiRouter = Router();
const UI_SERVICE_URL = process.env.UI_BASE_URL!;

uiRouter.use("/", httpProxy(UI_SERVICE_URL));

export { uiRouter };
