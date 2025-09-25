// Mock user for local mode (no Supabase)
const user = [];

user.me = async () => {
  // Mock current user – بعداً از localStorage load کن
  return (
    { id: "mock-user-1", full_name: "Local user", email: "user@example.com" } ||
    null
  );
};

export { user };
export default user;
