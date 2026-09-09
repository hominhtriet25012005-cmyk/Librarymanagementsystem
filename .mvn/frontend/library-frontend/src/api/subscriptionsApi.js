import httpClient from "./httpClient";

const compact = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== "" && value != null),
);

export const subscriptionsApi = {
  async getPlans() {
    const { data } = await httpClient.get("/api/subscription-plan");
    return data;
  },

  async getMine(params = {}) {
    const { data } = await httpClient.get("/api/subscriptions/my", { params: compact(params) });
    return data;
  },

  async getActive() {
    try {
      const { data } = await httpClient.get("/api/subscriptions/user/active");
      return data;
    } catch (error) {
      if (error.response?.status === 400
          && error.response.data?.message === "Không tìm thấy gói thành viên đang hoạt động") return null;
      throw error;
    }
  },

  async getPending() {
    const { data } = await httpClient.get("/api/subscriptions/user/pending");
    return data || null;
  },

  async subscribe(payload) {
    const { data } = await httpClient.post("/api/subscriptions/subscribe", payload);
    return data;
  },

  async cancel(subscriptionId, reason) {
    const { data } = await httpClient.post(`/api/subscriptions/cancel/${subscriptionId}`, null, {
      params: compact({ reason }),
    });
    return data;
  },
};

export const adminMembershipApi = {
  async getPlans() {
    const { data } = await httpClient.get("/api/subscription-plan/admin");
    return data;
  },

  async createPlan(payload) {
    const { data } = await httpClient.post("/api/subscription-plan/admin/create", payload);
    return data;
  },

  async updatePlan(planId, payload) {
    const { data } = await httpClient.put(`/api/subscription-plan/admin/${planId}`, payload);
    return data;
  },

  async hidePlan(planId) {
    const { data } = await httpClient.delete(`/api/subscription-plan/admin/${planId}`);
    return data;
  },

  async searchSubscriptions(params = {}) {
    const { data } = await httpClient.get("/api/subscriptions/admin", { params: compact(params) });
    return data;
  },

  async getStats() {
    const { data } = await httpClient.get("/api/subscriptions/admin/stats");
    return data;
  },

  async cancel(subscriptionId, reason) {
    return subscriptionsApi.cancel(subscriptionId, reason);
  },

  async deactivateExpired() {
    const { data } = await httpClient.post("/api/subscriptions/admin/deactivate-expired");
    return data;
  },
};
