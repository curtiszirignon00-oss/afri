import Express from "express";
import * as controller from "../controllers/auth.controller";
import { auth } from "../middlewares/auth.middleware";
import { validateLogin } from "@/validation/auth.validation";
const router = Express.Router();

router.post('/login', validateLogin, controller.login);
router.get('/logout', controller.logout);
router.get('/me', auth, controller.getMe);

export default router;