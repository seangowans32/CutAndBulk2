import express from "express";
import userCtrl from "../controllers/user.controller.js";

const router = express.Router();

router.route("/").post(userCtrl.create);
router.route("/").get(userCtrl.list);
router.route("/").delete(userCtrl.deleteAllUsers);
router.param("userId", userCtrl.userByID);
router.route("/:userId").get(userCtrl.read);
router.route("/:userId").put(userCtrl.update);
router.route("/:userId").delete(userCtrl.remove);

export default router;