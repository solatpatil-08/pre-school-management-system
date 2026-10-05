/**
 * Standardized API response helper
 * Ensures predictable payload structure while maintaining full compatibility
 * with frontend property lookups.
 */
class ApiResponse {
  static success(res, { statusCode = 200, message = 'Success', data = null, meta = null, extra = {} }) {
    const payload = {
      success: true,
      message,
      ...(data !== null && typeof data === 'object' && !Array.isArray(data) ? data : { data }),
      ...extra,
    };

    if (payload.data === undefined && data !== null) {
      payload.data = data;
    }

    if (Array.isArray(data)) {
      payload.data = data;
    }

    if (meta) {
      payload.meta = meta;
    }

    return res.status(statusCode).json(payload);
  }

  static created(res, { message = 'Resource created successfully', data = null, extra = {} }) {
    return ApiResponse.success(res, { statusCode: 201, message, data, extra });
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;
