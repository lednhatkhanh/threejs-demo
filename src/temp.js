      //       // Spaceship
      // new MTLLoader().load("/assets/spaceship/spaceship.mtl", materials => {
      //   materials.preload();

      //   const objLoader = new OBJLoader();
      //   objLoader.setMaterials(materials);
      //   objLoader.load(
      //     "/assets/spaceship/spaceship.obj",
      //     obj => {
      //       // center the model
      //       const box = new THREE.Box3().setFromObject(obj);
      //       const center = new THREE.Vector3();
      //       box.getCenter(center);
      //       obj.position.sub(center);

      //       this.scene.add(obj);
      //     },
      //     null,
      //     error => {
      //       // eslint-disable-next-line no-console
      //       console.error(error);
      //     }
      //   );
      // });