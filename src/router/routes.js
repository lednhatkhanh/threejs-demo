export const routes = [
  {
    path: "/",
    component: () => import("../pages/Home.vue"),
    meta: {
      title: "ThreeJS examples"
    }
  },
  {
    path: "/gltf",
    component: () => import("../pages/GLTF.vue"),
    meta: {
      title: "GLTF File example"
    }
  },
  {
    path: "/obj",
    component: () => import("../pages/OBJ.vue"),
    meta: {
      title: "OBJ File example"
    }
  }
];
