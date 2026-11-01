// server/src/validators/fileValidator.js
//
// Non-file fields of POST /files (multipart). The file itself is checked by
// services/storage/fileRules.js.

import { Joi, oneOf } from "./common.js";
import { FILE_PURPOSES } from "../models/File.js";

export const uploadFileSchema = Joi.object({
  purpose: oneOf(FILE_PURPOSES).required(),
}).required();
