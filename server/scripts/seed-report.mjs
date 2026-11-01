// Read-only report of the demo tenants: document counts per collection for
// each demo organization (proves the seed is idempotent when run twice).
//   npm run seed:report            counts
//   npm run seed:report -- classes list name/code of one collection's demo rows
import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
await mongoose.connect(uri);
const db = mongoose.connection.db;

const orgs = await db
  .collection("organizations")
  .find({ owner: { $in: (await db.collection("users").find({ email: { $in: ["admin@demo.paisa.test", "admin@demo2.paisa.test"] } }).toArray()).map((u) => u._id) } })
  .toArray();

const only = process.argv[2];
const collections = (await db.listCollections().toArray()).map((c) => c.name).sort();

for (const org of orgs) {
  console.log(`\n${org.name} (${org.slug}, ${org.type}${org.isDeleted ? ", DELETED" : ""}) ${org._id}`);

  for (const name of collections) {
    if (only && name !== only) continue;
    const coll = db.collection(name);
    const count = await coll.countDocuments({ instituteId: org._id });
    if (!count) continue;

    if (only) {
      const rows = await coll.find({ instituteId: org._id }).limit(200).toArray();
      for (const row of rows) {
        console.log("  ", row.publicId, row.name ?? row.title ?? row.subject ?? row.email ?? "", row.code ?? row.status ?? "", row.isDeleted ? "(deleted)" : "");
      }
    } else {
      console.log(`  ${name.padEnd(26)} ${count}`);
    }
  }
}

await mongoose.disconnect();
