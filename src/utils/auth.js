export function getUsers() {
  const raw = localStorage.getItem("users");
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

export function getCurrentUser() {
  const raw = localStorage.getItem("currentUser");
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getCurrentUser();
}

export function registerUser({ name, email, password }) {
  const users = getUsers();
  const exists = users.some((u) => u.email === email);
  if (exists) {
    throw new Error("Email already registered");
  }
  const newUser = { id: Date.now(), name, email, password };
  users.push(newUser);
  saveUsers(users);
  localStorage.setItem("currentUser", JSON.stringify(newUser));
  window.dispatchEvent(new Event("storage")); // notify listeners in same tab
  return newUser;
}

export function loginUser({ email, password }) {
  const users = getUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    throw new Error("Invalid email or password");
  }
  localStorage.setItem("currentUser", JSON.stringify(user));
  window.dispatchEvent(new Event("storage"));
  
  // 觸發購物車同步事件（讓 store 知道需要同步）
  window.dispatchEvent(new CustomEvent("cart:sync-on-login", { detail: { user } }));
  
  return user;
}

export function logoutUser() {
  localStorage.removeItem("currentUser");
  window.dispatchEvent(new Event("storage"));
  
  // 觸發購物車登出事件（可選：清空或保留本地購物車）
  window.dispatchEvent(new CustomEvent("cart:sync-on-logout"));
}


