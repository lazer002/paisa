// server/src/routes/taxRoutes.js
//
// Income tax: own declaration + statement (payroll:read), the organization's
// declarations (payroll managers / finance), verification (payroll:update).

import express from "express";

import authenticate from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { body } from "../validators/common.js";
import {
  saveDeclarationSchema,
  verifyDeclarationSchema,
  estimateTaxSchema,
} from "../validators/taxValidator.js";
import {
  getDeclaration,
  saveDeclaration,
  listDeclarations,
  verifyDeclaration,
  getStatement,
  estimateTax,
  TAX_PERMISSIONS,
} from "../controllers/taxController.js";

const router = express.Router();

router.use(authenticate);

const selfService = authorize({ anyPermissions: ["payroll:read"] });

router.get("/declaration", selfService, getDeclaration);
router.put("/declaration", selfService, body(saveDeclarationSchema), saveDeclaration);
router.get("/statement", selfService, getStatement);
router.post("/estimate", selfService, body(estimateTaxSchema), estimateTax);

router.get(
  "/declarations",
  authorize({ anyPermissions: TAX_PERMISSIONS.VIEW_OTHERS }),
  listDeclarations
);

router.post(
  "/declarations/:publicId/verify",
  authorize({ anyPermissions: TAX_PERMISSIONS.VERIFY }),
  body(verifyDeclarationSchema),
  verifyDeclaration
);

export default router;
