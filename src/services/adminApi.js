import { fetchWithAuth } from "./api";

export const adminApi = {
  getStats: () => fetchWithAuth("/admin/stats"),
  
  getUsers: () => fetchWithAuth("/admin/users"),
  
  getUserById: (id) => fetchWithAuth(`/admin/users/${id}`),
  
  getMentors: () => fetchWithAuth("/admin/mentors"),
  
  getMentorById: (id) => fetchWithAuth(`/admin/mentors/${id}`),
  
  approveMentor: (id) => fetchWithAuth(`/admin/mentors/${id}/approve`, { method: "PATCH" }),
  
  rejectMentor: (id, notes) => fetchWithAuth(`/admin/mentors/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  }),
  
  updateMentorSubscription: (id, data) => fetchWithAuth(`/admin/mentors/${id}/subscription`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  
  getActivity: () => fetchWithAuth("/admin/activity"),
};
