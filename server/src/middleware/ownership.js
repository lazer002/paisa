import mongoose from "mongoose";

export const checkOwnership = (Model, options = {}) => {
  const {
    ownerField = "owner",
    parentModel = null,
    parentField = null,
    parentOwnerField = "owner",
  } = options;

  return async (req, res, next) => {
    try {
      if (req.user.role === "super_admin") return next();

      const { id } = req.params;

      // 🔒 Validate ObjectId early
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID",
        });
      }

      // ⚡ fetch only required fields
      const doc = await Model.findById(id)
        .select(`${ownerField} ${parentField}`)
        .lean();

      if (!doc) {
        return res.status(404).json({
          success: false,
          message: "Resource not found",
        });
      }

      let ownerId = doc[ownerField];

      // 🔁 indirect ownership (e.g. teacher → institute → owner)
      if (!ownerId && parentModel && parentField) {
        const parent = await parentModel.findById(doc[parentField])
          .select(parentOwnerField)
          .lean();

        if (!parent) {
          return res.status(404).json({
            success: false,
            message: "Parent resource not found",
          });
        }

        ownerId = parent[parentOwnerField];
      }

      if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      // ⚡ don't attach full doc (keep lightweight)
      req.resourceId = id;

      next();
    } catch (err) {
      console.error("Ownership error:", err);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
};