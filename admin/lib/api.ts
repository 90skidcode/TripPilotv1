const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class SuperAdminAPI {
  static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("superadmin_token");
  }

  static setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("superadmin_token", token);
    }
  }

  static clearToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("superadmin_token");
    }
  }

  static async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const data = await response.json();
    this.setToken(data.access_token);
    return data;
  }

  static async logout(): Promise<void> {
    this.clearToken();
  }

  static async getAgencies(): Promise<any[]> {
    const token = this.getToken();
    console.log(`[getAgencies] Using token: ${token?.substring(0, 20)}...`);
    console.log(`[getAgencies] API URL: ${API_URL}/superadmin/agencies`);

    try {
      const response = await fetch(`${API_URL}/superadmin/agencies`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`[getAgencies] Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[getAgencies] HTTP ${response.status}:`, errorData);
        throw new Error(`Failed to fetch agencies: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`[getAgencies] Network error:`, error);
      throw error;
    }
  }

  static async getAgency(id: number): Promise<any> {
    const response = await fetch(`${API_URL}/superadmin/agencies/${id}`, {
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch agency");
    }

    return response.json();
  }

  static async createAgency(data: {
    name: string;
    slug: string;
    phone_number: string;
    logo_url: string;
    user_name: string;
    user_phone: string;
    user_email: string;
    user_password?: string;
    plan_id: number;
  }): Promise<any> {
    const response = await fetch(`${API_URL}/superadmin/agencies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to create agency");
    }

    return response.json();
  }

  static async updateAgency(id: number, data: Partial<{ name: string; plan: string; phone_number: string; logo_url: string; plan_id: number }>): Promise<any> {
    const response = await fetch(`${API_URL}/superadmin/agencies/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update agency");
    }

    return response.json();
  }

  static async toggleAgency(id: number): Promise<any> {
    const response = await fetch(`${API_URL}/superadmin/agencies/${id}/suspend`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });

    if (!response.ok) {
      throw new Error("Failed to toggle agency");
    }

    return response.json();
  }

  static async getAgencyUsers(id: number): Promise<any[]> {
    const response = await fetch(`${API_URL}/superadmin/agencies/${id}/users`, {
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch agency users");
    }

    return response.json();
  }

  static async getHealth(): Promise<any> {
    const response = await fetch(`${API_URL}/superadmin/health`, {
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch health");
    }

    return response.json();
  }

  static async impersonateUser(userId: number): Promise<{ token: string; user_id: number; org_id: number }> {
    const response = await fetch(`${API_URL}/superadmin/impersonate/${userId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });

    if (!response.ok) {
      throw new Error("Failed to impersonate user");
    }

    return response.json();
  }

  static async getPricingPlans(): Promise<any[]> {
    const response = await fetch(`${API_URL}/pricing/plans`);

    if (!response.ok) {
      throw new Error("Failed to fetch pricing plans");
    }

    return response.json();
  }

  static async getAllPricingPlans(): Promise<any[]> {
    const response = await fetch(`${API_URL}/pricing/plans/all`, {
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      throw new Error("Failed to fetch all pricing plans");
    }

    return response.json();
  }

  static async createPricingPlan(data: any): Promise<any> {
    const response = await fetch(`${API_URL}/pricing/plans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create pricing plan");
    }

    return response.json();
  }

  static async updatePricingPlan(id: number, data: any): Promise<any> {
    const response = await fetch(`${API_URL}/pricing/plans/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update pricing plan");
    }

    return response.json();
  }

  static async deletePricingPlan(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/pricing/plans/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });

    if (!response.ok) {
      throw new Error("Failed to delete pricing plan");
    }
  }

  static async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/upload/image`, {
      method: "POST",
      headers: headers,
      body: formData
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to upload image");
    }

    const data = await response.json();
    return `${API_URL}${data.url}`;
  }

  static async getAgencyUserGroups(agencyId: number): Promise<any[]> {
    const response = await fetch(`${API_URL}/superadmin/agencies/${agencyId}/user-groups`, {
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user groups");
    }

    return response.json();
  }

  static async createAgencyUserGroup(agencyId: number, data: any): Promise<any> {
    const response = await fetch(`${API_URL}/superadmin/agencies/${agencyId}/user-groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to create user group");
    }

    return response.json();
  }

  static async updateAgencyUserGroup(agencyId: number, groupId: number, data: any): Promise<any> {
    const response = await fetch(`${API_URL}/superadmin/agencies/${agencyId}/user-groups/${groupId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to update user group");
    }

    return response.json();
  }

  static async deleteAgencyUserGroup(agencyId: number, groupId: number): Promise<void> {
    const response = await fetch(`${API_URL}/superadmin/agencies/${agencyId}/user-groups/${groupId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });

    if (!response.ok) {
      throw new Error("Failed to delete user group");
    }
  }

  static async updateAgencyUser(userId: number, data: any): Promise<any> {
    const response = await fetch(`${API_URL}/superadmin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to update agency user");
    }

    return response.json();
  }

  // ── Billing Cycles ──

  static async getPlanBillingCycles(planId: number): Promise<any[]> {
    const response = await fetch(`${API_URL}/pricing/plans/${planId}/billing-cycles`, {
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch billing cycles");
    }

    return response.json();
  }

  static async createBillingCycle(planId: number, data: any): Promise<any> {
    const response = await fetch(`${API_URL}/pricing/plans/${planId}/billing-cycles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to create billing cycle");
    }

    return response.json();
  }

  static async updateBillingCycle(cycleId: number, data: any): Promise<any> {
    const response = await fetch(`${API_URL}/pricing/billing-cycles/${cycleId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to update billing cycle");
    }

    return response.json();
  }

  static async deleteBillingCycle(cycleId: number): Promise<void> {
    const response = await fetch(`${API_URL}/pricing/billing-cycles/${cycleId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });

    if (!response.ok) {
      throw new Error("Failed to delete billing cycle");
    }
  }

  // ── Master Data ──

  static async getMasterDataCategories(): Promise<string[]> {
    const response = await fetch(`${API_URL}/master-data/categories`, {
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }

    return response.json();
  }

  static async getMasterData(category: string): Promise<any[]> {
    const response = await fetch(`${API_URL}/master-data/${category}`, {
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch master data");
    }

    return response.json();
  }

  static async createMasterData(data: any): Promise<any> {
    const response = await fetch(`${API_URL}/master-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to create master data");
    }

    return response.json();
  }

  static async updateMasterData(id: number, data: any): Promise<any> {
    const response = await fetch(`${API_URL}/master-data/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to update master data");
    }

    return response.json();
  }

  static async deleteMasterData(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/master-data/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });

    if (!response.ok) {
      throw new Error("Failed to delete master data");
    }
  }
}


