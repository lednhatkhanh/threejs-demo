import VueRouter from "vue-router";

import { routes } from "./routes";

export const router = new VueRouter({
  routes
});

router.beforeEach((to, from, next) => {
  if (to.meta && to.meta.title) {
    document.title = to.meta.title;
  }

  next();
});
