const BASE = import.meta.env?.VITE_API_URL ?? "http://localhost:3001";

export const api = {
  // Schools
  getSchools: () =>
    fetch(`${BASE}/schools?is_active=true`).then((r) => r.json()),

  // Plans
  getPlansBySchool: (schoolId) =>
    fetch(`${BASE}/financing_plans?school_id=${schoolId}&is_active=true`).then(
      (r) => r.json()
    ),

  // Applications
  getApplications: () =>
    fetch(`${BASE}/applications`).then((r) => r.json()),

  getApplication: (id) =>
    fetch(`${BASE}/applications/${id}`).then((r) => r.json()),

  createApplication: (data) =>
    fetch(`${BASE}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        status: "draft",
        created_at: new Date().toISOString(),
      }),
    }).then((r) => r.json()),

  updateApplication: (id, data) =>
    fetch(`${BASE}/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  // Contracts
  getContracts: () =>
    fetch(`${BASE}/contracts`).then((r) => r.json()),

  getContract: (id) =>
    fetch(`${BASE}/contracts/${id}`).then((r) => r.json()),

  updateContract: (id, data) =>
    fetch(`${BASE}/contracts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  // Settlements
  getSettlements: () =>
    fetch(`${BASE}/settlements`).then((r) => r.json()),
};
