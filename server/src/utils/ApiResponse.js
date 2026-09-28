// server/src/utils/ApiResponse.js

class ApiResponse {
  constructor({
    success = true,
    statusCode = 200,
    message = "Operation completed successfully",
    data = null,
    meta = null,
    pagination = null,
    requestId = null,
  } = {}) {
    this.success = Boolean(success);
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;

    if (meta !== null && meta !== undefined) {
      this.meta = meta;
    }

    if (pagination !== null && pagination !== undefined) {
      this.pagination = pagination;
    }

    if (requestId) {
      this.requestId = requestId;
    }
  }

  toJSON() {
    const response = {
      success: this.success,
      message: this.message,
      data: this.data,
    };

    if (this.meta !== undefined) {
      response.meta = this.meta;
    }

    if (this.pagination !== undefined) {
      response.pagination = this.pagination;
    }

    if (this.requestId) {
      response.requestId = this.requestId;
    }

    return response;
  }

  static success(data = null, message = "Operation completed successfully", options = {}) {
    return new ApiResponse({
      success: true,
      statusCode: options.statusCode || 200,
      message,
      data,
      meta: options.meta,
      pagination: options.pagination,
      requestId: options.requestId,
    });
  }

  static created(data = null, message = "Resource created successfully", options = {}) {
    return new ApiResponse({
      success: true,
      statusCode: 201,
      message,
      data,
      meta: options.meta,
      pagination: options.pagination,
      requestId: options.requestId,
    });
  }

  static accepted(data = null, message = "Request accepted successfully", options = {}) {
    return new ApiResponse({
      success: true,
      statusCode: 202,
      message,
      data,
      meta: options.meta,
      pagination: options.pagination,
      requestId: options.requestId,
    });
  }

  static noContent(message = "Operation completed successfully", options = {}) {
    return new ApiResponse({
      success: true,
      statusCode: 204,
      message,
      data: null,
      meta: options.meta,
      requestId: options.requestId,
    });
  }

  static paginated(
    data = [],
    pagination = {},
    message = "Data retrieved successfully",
    options = {}
  ) {
    return new ApiResponse({
      success: true,
      statusCode: options.statusCode || 200,
      message,
      data,
      pagination,
      meta: options.meta,
      requestId: options.requestId,
    });
  }
}

export default ApiResponse;
