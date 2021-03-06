let app = new PIXI.Application({
  backgroundColor: 0x555555, resizeTo: window, antialias: true
})
document.body.appendChild(app.view)

app.loader.add("assets/models/buster_drone/scene.gltf")

app.loader.load((loader, resources) => {
  let model = app.stage.addChild(
    PIXI3D.Model.from(resources["assets/models/buster_drone/scene.gltf"].gltf))

  /* Adds a point light to the main lighting environment.*/
  let light = Object.assign(new PIXI3D.Light(), {
    type: "point", x: -1, y: 0, z: 3, range: 10, intensity: 10
  })
  PIXI3D.LightingEnvironment.main.lights.push(light)

  /* Moves the model to 0.3 on the y-axis. Rotates it to 25 degrees on the 
  y-axis and scales it on all axes.*/
  model.position.y = 0.3
  model.scale.set(2)
  model.rotationQuaternion.setEulerAngles(0, 25, 0)

  /* Starts playing the first animation in the model.*/
  model.animations[0].play()

  /* Adds a 2D vignette layer on top of the 3D scene to give it a more cinematic 
  effect. Resizes the vignette to the size of the renderer.*/
  let vignette = app.stage.addChild(
    new PIXI.Sprite(PIXI.Texture.from("assets/vignette.png")))

  app.ticker.add(() => {
    Object.assign(vignette, {
      width: app.renderer.width, height: app.renderer.height
    })
  })

  let logo = app.stage.addChild(
    new PIXI.Sprite(PIXI.Texture.from("assets/logo.png")))
  logo.position.set(10, 10)

  /* Gives the user orbit control over the main camera using mouse/trackpad. 
  Hold left mouse button and drag to orbit, use scroll wheel to zoom in/out.*/
  let control = new PIXI3D.CameraOrbitControl(app.view)
})