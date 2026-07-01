const express = require("express");
const router = express.Router();

const {
  getUtilityTools,
  getUtilityStats,
  createOrUpdateUtilityTool,
  updateUtilityStatus,
  deleteUtilityTool,
} = require("../controllers/exaltUtilityController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

/* USER ROUTES */
router.get("/", protect, getUtilityTools);

/* ADMIN ROUTES */
router.get("/admin/stats", protect, adminOnly, getUtilityStats);
router.get("/admin/tools", protect, adminOnly, getUtilityTools);
router.post("/admin/tool", protect, adminOnly, createOrUpdateUtilityTool);
router.put("/admin/tool/:id", protect, adminOnly, updateUtilityStatus);
router.delete("/admin/tool/:id", protect, adminOnly, deleteUtilityTool);

module.exports = router;