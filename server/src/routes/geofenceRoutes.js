// server/src/routes/geofenceRoutes.js

import express from "express";

import {
  createGeofence,
  getGeofences,
  updateGeofence,
  deleteGeofence,
} from "../controllers/geofenceController.js";

import authenticate from "../middleware/authenticate.js";

import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);

router.get("/", authorize({ anyPermissions: ["geofence:read"] }), getGeofences);

router.post("/", authorize({ anyPermissions: ["geofence:create"] }), createGeofence);

router.put(
  "/:publicId",
  authorize({ anyPermissions: ["geofence:update"] }),
  updateGeofence
);

router.delete(
  "/:publicId",
  authorize({ anyPermissions: ["geofence:delete"] }),
  deleteGeofence
);

export default router;
