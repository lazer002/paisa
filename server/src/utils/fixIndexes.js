// server/src/utils/fixIndexes.js
//
// One-off maintenance for databases created before config/mongoosePlugins.js:
// replaces the old unique+sparse compound indexes with the partial versions.
// Only indexes that the plugin rewrites are touched (dropped by name, then
// rebuilt); everything else in the database is left alone.
//
//   npm run db:fix-indexes -- --dry-run   list what would change
//   npm run db:fix-indexes                apply

import "dotenv/config";
import "../config/mongoosePlugins.js";

import fs from "node:fs";
import mongoose from "mongoose";

import { connectDB, disconnectDB } from "../config/db.js";

const DRY_RUN = process.argv.includes("--dry-run");

const modelsDir = new URL("../models/", import.meta.url);

for (const file of fs.readdirSync(modelsDir)) {
  if (file.endsWith(".js")) {
    await import(new URL(file, modelsDir));
  }
}

const run = async () => {
  await connectDB();

  let changed = 0;

  try {
    for (const Model of Object.values(mongoose.models)) {
      const wanted = Model.schema
        .indexes()
        .filter(([, options]) => options?.partialFilterExpression && options?.unique);

      if (wanted.length === 0) continue;

      let existing = [];

      try {
        existing = await Model.collection.indexes();
      } catch {
        // Collection does not exist yet: nothing to fix.
        continue;
      }

      for (const [fields, options] of wanted) {
        const current = existing.find((index) => index.name === options.name);

        // Missing indexes are created normally on startup; only replace old ones.
        if (!current || current.partialFilterExpression) continue;

        changed += 1;
        console.log("%s %s.%s", DRY_RUN ? "would fix" : "fixing", Model.collection.name, options.name);

        if (!DRY_RUN) {
          await Model.collection.dropIndex(options.name);
          // Rebuild just this index; unrelated index conflicts in the
          // collection must not stop the others from being fixed.
          await Model.collection.createIndex(fields, options);
        }
      }
    }
  } finally {
    await disconnectDB();
  }

  console.log(DRY_RUN ? "%d index(es) need fixing." : "%d index(es) fixed.", changed);
};

run().catch((error) => {
  console.error("Index fix failed:", error.message);
  process.exitCode = 1;
});
