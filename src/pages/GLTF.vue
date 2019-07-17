<template>
  <div>
    <canvas ref="canvas"></canvas>
    <section id="loading-screen">
      <div id="loader"></div>
    </section>
  </div>
</template>

<script>
import * as THREE from "three";
import OrbitControls from "three-orbitcontrols";
import * as dat from "dat.gui";
import * as STATS from "stats.js";

import { DRACOLoader } from "../loaders/draco-loader";
import { GLTFLoader } from "../loaders/gltf-loader";

const materialList = Array.from({ length: 5 }).map(
  (_v, i) => `material${i + 1}`
);

export default {
  name: "app",
  data() {
    return {
      scene: undefined,
      renderer: undefined,
      camera: undefined,
      controls: undefined,
      guiControls: undefined,
      shirt: undefined,
      controller: undefined,
      oldController: undefined,
      stats: undefined,
      materials: {}
    };
  },
  mounted() {
    this.loadAllShirtMaterials();
    this.init();
  },
  methods: {
    onTransitionEnd(event) {
      const element = event.target;
      element.remove();
    },
    init() {
      let group = new THREE.Group();
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.0001,
        1000
      );
      this.camera.position.z = 0.8;
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xf2f3f4);

      const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
      this.scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0xffffff, 0.8);
      this.camera.add(pointLight);
      this.scene.add(this.camera);

      this.createDataGUI();
      this.stats = new STATS();
      this.stats.showPanel(0);
      document.body.appendChild(this.stats.dom);

      const buttonTexture = new THREE.TextureLoader().load(
        `${process.env.VUE_APP_API_ENDPOINT}/assets/shirt/textures/button.jpg`
      );
      buttonTexture.offset.x = 0.3;
      buttonTexture.offset.y = 0.34;
      buttonTexture.repeat.set(0.69, 0.69);
      const buttonMaterial = new THREE.MeshBasicMaterial({
        map: buttonTexture
      });

      const loadingManager = new THREE.LoadingManager(() => {
        const loadingScreen = document.getElementById("loading-screen");
        loadingScreen.classList.add("fade-out");

        // optional: remove loader from DOM via event listener
        loadingScreen.addEventListener("transitionend", this.onTransitionEnd);
      });

      const gltfLoader = new GLTFLoader(loadingManager);
      gltfLoader.setDRACOLoader(new DRACOLoader());

      // gltfLoader.load

      gltfLoader.load(
        `${process.env.VUE_APP_API_ENDPOINT}/assets/shirt/shirt.gltf`,
        gltf => {
          const children = [...gltf.scene.children];
          children.forEach(mesh => {
            if (mesh.name.includes("Button")) {
              mesh.material = buttonMaterial;
            } else {
              mesh.material = this.materials.material1;
            }
            group.add(mesh);
          });

          const box = new THREE.Box3().setFromObject(group);
          const center = new THREE.Vector3();
          box.getCenter(center);
          group.position.sub(center);

          this.shirt = group;
          this.scene.add(group);
        }
      );

      // Create the renderer
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.$refs.canvas,
        antialias: true
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);

      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.25;
      this.controls.enableZoom = true;

      this.stats.begin();
      this.render();

      window.addEventListener(
        "resize",
        this.resizeRendererToDisplaySize,
        false
      );
    },
    createDataGUI() {
      this.controller = new (function() {
        this.hideCollar = false;
        this.hideCuffs = false;
        this.hideButtons = false;

        // Material
        this.frontMaterial = materialList[0];
        this.backMaterial = materialList[0];
        this.sleevesMaterial = materialList[0];
        this.cuffsMaterial = materialList[0];
      })();

      this.oldController = {
        ...this.controller
      };

      const gui = new dat.GUI();
      const shirtFolder = gui.addFolder("Shirt");
      shirtFolder.closed = false;
      shirtFolder.add(this.controller, "hideCollar");
      shirtFolder.add(this.controller, "hideCuffs");
      shirtFolder.add(this.controller, "hideButtons");

      const materialFolder = gui.addFolder("Materials");
      materialFolder.closed = false;
      materialFolder.add(this.controller, "frontMaterial", materialList);
      materialFolder.add(this.controller, "backMaterial", materialList);
      materialFolder.add(this.controller, "sleevesMaterial", materialList);
      materialFolder.add(this.controller, "cuffsMaterial", materialList);
    },
    loadAllShirtMaterials() {
      const textureLoader = new THREE.TextureLoader();
      materialList.forEach(materialName => {
        const materialPath = `${process.env.VUE_APP_API_ENDPOINT}/assets/shirt/textures/${materialName}`;

        const map = textureLoader.load(`${materialPath}/map.jpg`);
        const normal = textureLoader.load(`${materialPath}/normal.jpg`);
        const displacement = textureLoader.load(
          `${materialPath}/displacement.png`
        );
        const occlusion = textureLoader.load(`${materialPath}/occlusion.jpg`);

        map.userData = {
          fitTo: 1
        };
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.offset.set(0, 0);
        map.repeat.set(10, 10);

        this.materials[materialName] = new THREE.MeshPhongMaterial({
          map,
          normalMap: normal,
          bumpMap: displacement,
          aoMap: occlusion,
          shininess: 0
        });
      });
    },
    render() {
      if (this.shirt) {
        this.handleShowHideButtons();
        this.handleShowHideCollar();
        this.handleShowHideCuffs();
        this.handleFrontMaterialChange();
        this.handleBackMaterialChange();
        this.handleSleevesMaterialChange();
        this.handleCuffsMaterialChange();
      }

      this.stats.update();

      this.camera.lookAt(this.scene.position);
      this.renderer.render(this.scene, this.camera);

      // this.controls.update();
      requestAnimationFrame(this.render);
    },
    resizeRendererToDisplaySize() {
      const canvas = this.$refs.canvas;
      if (canvas) {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      }
    },
    handleShowHideButtons() {
      if (this.controller.hideButtons != this.oldController.hideButtons) {
        this.shirt.traverse(child => {
          if (child.name.includes("Button")) {
            child.visible = !this.controller.hideButtons;
          }
        });

        this.oldController = {
          ...this.oldController,
          hideButtons: this.controller.hideButtons
        };
      }
    },
    handleShowHideCollar() {
      if (this.controller.hideCollar != this.oldController.hideCollar) {
        this.shirt.traverse(child => {
          if (child.name.includes("Collar")) {
            child.visible = !this.controller.hideCollar;
          }
        });

        this.oldController = {
          ...this.oldController,
          hideCollar: this.controller.hideCollar
        };
      }
    },
    handleShowHideCuffs() {
      if (this.controller.hideCuffs != this.oldController.hideCuffs) {
        this.shirt.traverse(child => {
          if (child.name.includes("Cuff")) {
            child.visible = !this.controller.hideCuffs;
          }
        });

        this.oldController = {
          ...this.oldController,
          hideCuffs: this.controller.hideCuffs
        };
      }
    },
    handleFrontMaterialChange() {
      if (
        this.oldController.frontMaterial !== this.controller.frontMaterial &&
        this.materials[this.controller.frontMaterial]
      ) {
        this.shirt.traverse(child => {
          if (child.name.includes("Front")) {
            child.material = this.materials[this.controller.frontMaterial];
          }
        });

        this.oldController = {
          ...this.oldController,
          frontMaterial: this.controller.frontMaterial
        };
      }
    },
    handleBackMaterialChange() {
      if (
        this.oldController.backMaterial !== this.controller.backMaterial &&
        this.materials[this.controller.backMaterial]
      ) {
        this.shirt.traverse(child => {
          if (child.name.includes("Back") || child.name.includes("Yoke")) {
            child.material = this.materials[this.controller.backMaterial];
          }
        });

        this.oldController = {
          ...this.oldController,
          backMaterial: this.controller.backMaterial
        };
      }
    },
    handleSleevesMaterialChange() {
      if (
        this.oldController.sleevesMaterial !==
          this.controller.sleevesMaterial &&
        this.materials[this.controller.sleevesMaterial]
      ) {
        this.shirt.traverse(child => {
          if (child.name.includes("Sleeve")) {
            child.material = this.materials[this.controller.sleevesMaterial];
          }
        });

        this.oldController = {
          ...this.oldController,
          sleevesMaterial: this.controller.sleevesMaterial
        };
      }
    },
    handleCuffsMaterialChange() {
      if (
        !this.controller.hideCuffs &&
        this.oldController.cuffsMaterial !== this.controller.cuffsMaterial &&
        this.materials[this.controller.cuffsMaterial]
      ) {
        this.shirt.traverse(child => {
          if (child.name.includes("Cuff")) {
            child.material = this.materials[this.controller.cuffsMaterial];
          }
        });

        this.oldController = {
          ...this.oldController,
          cuffsMaterial: this.controller.cuffsMaterial
        };
      }
    }
  }
};
</script>

<style>
body {
  margin: 0;
  overflow: hidden;
}

#loading-screen {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f2f3f4;
  opacity: 1;
  transition: 1s opacity;
}

#loading-screen.fade-out {
  opacity: 0;
}

#loader {
  display: block;
  position: relative;
  left: 50%;
  top: 50%;
  width: 150px;
  height: 150px;
  margin: -75px 0 0 -75px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #9370db;
  -webkit-animation: spin 2s linear infinite;
  animation: spin 2s linear infinite;
}
#loader:before {
  content: "";
  position: absolute;
  top: 5px;
  left: 5px;
  right: 5px;
  bottom: 5px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #ba55d3;
  -webkit-animation: spin 3s linear infinite;
  animation: spin 3s linear infinite;
}
#loader:after {
  content: "";
  position: absolute;
  top: 15px;
  left: 15px;
  right: 15px;
  bottom: 15px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #ff00ff;
  -webkit-animation: spin 1.5s linear infinite;
  animation: spin 1.5s linear infinite;
}
@-webkit-keyframes spin {
  0% {
    -webkit-transform: rotate(0deg);
    -ms-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    -ms-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@keyframes spin {
  0% {
    -webkit-transform: rotate(0deg);
    -ms-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    -ms-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
</style>