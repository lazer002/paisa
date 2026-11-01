// server/src/utils/seed/helpers.js
//
// Small helpers shared by the seed modules. `ensure` is the only way seed
// data is written: it looks a record up by a stable natural key and creates
// it only when missing, so re-running the seed never duplicates and never
// deletes anything. In a dry run nothing is queried or saved; every record is
// built and validated against its schema instead.

/**
 * findOne through the driver, bypassing query middleware: many models hide
 * soft-deleted rows in a pre-find hook, and recreating such a row would hit
 * its unique index. A soft-deleted seed record counts as existing.
 */
export const findRaw = async (Model, filter) => {
  const raw = await Model.collection.findOne(filter);
  return raw ? Model.hydrate(raw) : null;
};

export const createSeeder = ({ dryRun }) => {
  const stats = new Map();

  const tally = (name, key) => {
    if (!stats.has(name)) {
      stats.set(name, { created: 0, existing: 0 });
    }

    stats.get(name)[key] += 1;
  };

  /**
   * @param Model   mongoose model
   * @param filter  plain equality fields that identify the record (also copied into it)
   * @param build   object (or function returning one) with the remaining fields
   */
  const ensure = async (Model, filter, build = {}) => {
    if (!dryRun) {
      const found = await findRaw(Model, filter);

      if (found) {
        tally(Model.modelName, "existing");
        return found;
      }
    }

    const fields = typeof build === "function" ? await build() : build;
    const doc = new Model({ ...filter, ...fields });

    try {
      if (dryRun) {
        await doc.validate();
      } else {
        await doc.save();
      }
    } catch (error) {
      error.message = `${Model.modelName} ${JSON.stringify(filter)}: ${error.message}`;
      throw error;
    }

    tally(Model.modelName, "created");
    return doc;
  };

  /** Count a record found by a custom lookup as "already there". */
  const markExisting = (Model) => tally(Model.modelName, "existing");

  return { ensure, markExisting, stats, dryRun };
};

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight UTC `offset` days from today (negative = past). */
export const dayOffset = (offset) => {
  const now = new Date();
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(base + offset * DAY_MS);
};

/** YYYY-MM-DD of a Date in UTC. */
export const isoDay = (date) => date.toISOString().slice(0, 10);
