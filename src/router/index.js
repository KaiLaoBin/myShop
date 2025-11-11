import { createRouter, createWebHistory } from "vue-router";
import Home from "../view/Home.vue";
import AllItems from "../view/AllItems.vue";
import Login from "../view/Login.vue";
import Register from "../view/Register.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/all-items",
    name: "AllItems",
    component: AllItems,
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
