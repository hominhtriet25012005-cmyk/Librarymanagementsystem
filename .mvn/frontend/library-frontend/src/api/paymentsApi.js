import httpClient from "./httpClient";

const compact = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== "" && value != null),
);

export const paymentsApi = {
  async getMine(params = {}) {
    const { data } = await httpClient.get("/api/payments/my", { params: compact(params) });
    return data;
  },
  async submit(paymentId, payerReference) {
    const { data } = await httpClient.post(`/api/payments/${paymentId}/submit`, {
      payerReference: payerReference?.trim() || null,
    });
    return data;
  },
  async getInstructions(paymentId) {
    const { data } = await httpClient.get(`/api/payments/${paymentId}/instructions`);
    return data;
  },
};

export const adminPaymentsApi = {
  async getAll(params = {}) {
    const { data } = await httpClient.get("/api/payments", { params: compact(params) });
    return data;
  },
  async confirm(paymentId, bankTransactionId) {
    const { data } = await httpClient.post(`/api/payments/admin/${paymentId}/confirm`, {
      bankTransactionId: bankTransactionId.trim(),
    });
    return data;
  },
  async reject(paymentId, reason) {
    const { data } = await httpClient.post(`/api/payments/admin/${paymentId}/reject`, {
      reason: reason.trim(),
    });
    return data;
  },
};
