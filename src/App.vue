<template>
  <canvas ref="canvas"></canvas>
</template>

<script>
import * as THREE from "three";
// import OrbitControls from "three-orbitcontrols";
import * as dat from 'dat.gui';

import { OBJLoader } from "./loaders/obj-loader";
// import { MTLLoader } from "./loaders/mtl-loader";

const materialList = Array.from({ length: 5 }).map((_v, i) => `material${i + 1}`);

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
      materials: {},
    };
  },
  mounted() {
    this.loadAllShirtMaterials();
    this.init();
  },
  methods: {
    init() {
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.0001,
        1000
      );
      this.camera.position.z = 0.8;
      this.scene = new THREE.Scene();

      const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
      this.scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0xffffff, 0.8);
      this.camera.add(pointLight);
      this.scene.add(this.camera);

      const plane = this.createPlane();
      this.scene.add(plane);

      this.createDataGUI();

      const buttonTexture = new THREE.TextureLoader().load('assets/shirt/textures/button.jpg');
      const buttonMaterial = new THREE.MeshBasicMaterial( { map: buttonTexture } );

      new OBJLoader().load(
        "/assets/shirt/shirt.obj",
        obj => {
          obj.traverse(child => {
            if (child.isMesh) {
              if (child.name.includes("Button")) {
                child.material = buttonMaterial;
              } else {
                child.material = this.materials.material1;
              }

              child.castShadow = false;
              child.receiveShadow = false;
            }
          });

          // center the model
          const box = new THREE.Box3().setFromObject(obj);
          const center = new THREE.Vector3();
          box.getCenter(center);
          obj.position.sub(center);

          this.shirt = obj;
          this.scene.add(this.shirt);
        },
        null,
        error => {
          // eslint-disable-next-line no-console
          console.error(error);
        }
      );

      // Create the renderer
      this.renderer = new THREE.WebGLRenderer({ canvas: this.$refs.canvas });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);

      // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      // this.controls.enableDamping = true;
      // this.controls.dampingFactor = 0.25;
      // this.controls.enableZoom = true;

      this.render();

      window.addEventListener(
        "resize",
        this.resizeRendererToDisplaySize,
        false
      );
    },
    createPlane() {
      const geometry = new THREE.PlaneGeometry(20, 20, 32);
      const material = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} );
      const plane = new THREE.Mesh( geometry, material );
      plane.position.z -= 2;

      return plane;
    },
    createDataGUI() {
      this.controller = new function() {
        this.hideCollar = false;
        this.hideCuffs = false;
        this.hideButtons = false;

        // Material
        this.frontMaterial = materialList[0];
        this.backMaterial = materialList[0];
        this.sleevesMaterial = materialList[0];
        this.cuffsMaterial = materialList[0];
      }();

      this.oldController = {
        ...this.controller,
      };

      const gui = new dat.GUI();
      const shirtFolder = gui.addFolder('Shirt');
      shirtFolder.closed = false;
      shirtFolder.add(this.controller, 'hideCollar');
      shirtFolder.add(this.controller, 'hideCuffs');
      shirtFolder.add(this.controller, 'hideButtons');

      const materialFolder = gui.addFolder('Materials');
      materialFolder.closed = false;
      materialFolder.add(this.controller, 'frontMaterial', materialList);
      materialFolder.add(this.controller, 'backMaterial', materialList);
      materialFolder.add(this.controller, 'sleevesMaterial', materialList);
      materialFolder.add(this.controller, 'cuffsMaterial', materialList);
    },
    loadAllShirtMaterials() {
      materialList.forEach((materialName) => {
        const textureLoader = new THREE.TextureLoader();
        const materialPath = `assets/shirt/textures/${materialName}`;

        const map = textureLoader.load(`${materialPath}/map.jpg`);
        const normal = textureLoader.load(`${materialPath}/normal.jpg`);
        const displacement = textureLoader.load(`${materialPath}/displacement.png`);
        const occlusion = textureLoader.load(`${materialPath}/occlusion.jpg`);
        // const rough = textureLoader.load(`${materialPath}/rough.jpg`);

        map.userData = {
          fitTo : 1
        };
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.offset.set( 0, 0 );
        map.repeat.set( 10, 10 );

        this.materials[materialName] = new THREE.MeshPhongMaterial({ 
          map,
          normalMap: normal,
          bumpMap: displacement,
          aoMap: occlusion,
          shininess: 0,
        });
      });
    },
    render() {
      requestAnimationFrame(this.render);

      if (this.shirt) {
        this.shirt.rotation.y += 0.02;

        this.handleShowHideButtons();
        this.handleShowHideCollar();
        this.handleShowHideCuffs();
        this.handleFrontMaterialChange();
        this.handleBackMaterialChange();
        this.handleSleevesMaterialChange();
        this.handleCuffsMaterialChange();
      }

      this.camera.lookAt(this.scene.position);
      this.renderer.render(this.scene, this.camera);

      // this.controls.update();
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
        this.shirt.traverse((child) => {
          if (child.name.includes("Button")) {
            child.visible = !this.controller.hideButtons;
          }
        });

        this.oldController = {
          ...this.oldController,
          hideButtons: this.controller.hideButtons,
        };
      }
    },
    handleShowHideCollar() {
      if (this.controller.hideCollar != this.oldController.hideCollar) {
        this.shirt.traverse((child) => {
          if (child.name.includes("Collar")) {
            child.visible = !this.controller.hideCollar;
          }
        });

        this.oldController = {
          ...this.oldController,
          hideCollar: this.controller.hideCollar,
        };
      }
    },
    handleShowHideCuffs() {
      if (this.controller.hideCuffs != this.oldController.hideCuffs) {
        this.shirt.traverse((child) => {
          if (child.name.includes("Cuff")) {
            child.visible = !this.controller.hideCuffs;
          }
        });

        this.oldController = {
          ...this.oldController,
          hideCuffs: this.controller.hideCuffs,
        };
      }
    },
    handleFrontMaterialChange() {
      if (
        this.oldController.frontMaterial !== this.controller.frontMaterial
        && this.materials[this.controller.frontMaterial]
      ) {
        this.shirt.traverse((child) => {
          if (child.name.includes("Front")) {
            child.material = this.materials[this.controller.frontMaterial];
          }
        });

        this.oldController = {
          ...this.oldController,
          frontMaterial: this.controller.frontMaterial,
        };
      }
    },
    handleBackMaterialChange() {
      if (
        this.oldController.backMaterial !== this.controller.backMaterial
        && this.materials[this.controller.backMaterial]
      ) {
        this.shirt.traverse((child) => {
          if (child.name.includes("Back") || child.name.includes("Yoke")) {
            child.material = this.materials[this.controller.backMaterial];
          }
        });

        this.oldController = {
          ...this.oldController,
          backMaterial: this.controller.backMaterial,
        };
      }
    },
    handleSleevesMaterialChange() {
      if (
        this.oldController.sleevesMaterial !== this.controller.sleevesMaterial
        && this.materials[this.controller.sleevesMaterial]
      ) {
        this.shirt.traverse((child) => {
          if (child.name.includes("Sleeve")) {
            child.material = this.materials[this.controller.sleevesMaterial];
          }
        });

        this.oldController = {
          ...this.oldController,
          sleevesMaterial: this.controller.sleevesMaterial,
        };
      }
    },
    handleCuffsMaterialChange() {
      if (
        this.oldController.cuffsMaterial !== this.controller.cuffsMaterial
        && this.materials[this.controller.cuffsMaterial]
      ) {
        this.shirt.traverse((child) => {
          if (child.name.includes("Cuff")) {
            child.material = this.materials[this.controller.cuffsMaterial];
          }
        });

        this.oldController = {
          ...this.oldController,
          cuffsMaterial: this.controller.cuffsMaterial,
        };
      }
    },
  }
};

</script>

<style>
body {
  margin: 0;
  overflow: hidden;
}
</style>
