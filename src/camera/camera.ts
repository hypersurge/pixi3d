import * as PIXI from "pixi.js"

import { Container3D } from "../container"
import { Mat4 } from "../math/mat4"
import { Vec3 } from "../math/vec3"
import { Vec4 } from "../math/vec4"
import { MatrixComponent } from "../transform/matrix-component"
import { ObservablePoint3D } from "../transform/observable-point"

const mat4 = new Float32Array(16)
const vec4 = new Float32Array(4)

/**
 * Camera is a device from which the world is viewed.
 */
export class Camera extends Container3D {
  private _id = 0

  get id() {
    return (<any>this.transform)._worldID + this._id
  }

  private _projection?: MatrixComponent
  private _view?: MatrixComponent
  private _viewProjection?: MatrixComponent
  private _target?: MatrixComponent

  /** Main camera which is used by default. */
  static main: Camera

  /**
   * Creates a new camera using the specified renderer. By default the camera
   * looks towards negative z and is positioned at z = 5.
   * @param renderer Renderer to use.
   */
  constructor(public renderer: PIXI.Renderer) {
    super()

    this.renderer.on("prerender", () => {
      if (!this._aspect) {
        // When there is no specific aspect set, this is used for the 
        // projection matrix to always update each frame (in case when the 
        // renderer aspect ratio has changed).
        this._id++
      }
      if (!this.parent) {
        // When the camera is not attached to the scene hierarchy the transform 
        // needs to be updated manually.
        this.transform.updateTransform()
      }
    })
    if (!Camera.main) {
      Camera.main = this
    }
    this.transform.position.z = 5
    this.transform.rotationQuaternion.setEulerAngles(0, 180, 0)
  }

  /**
   * Converts screen coordinates to world coordinates.
   * @param x Screen x coordinate.
   * @param y Screen y coordinate.
   * @param distance Distance from the camera.
   * @param point Point to set.
   */
  screenToWorld(x: number, y: number, distance: number, point = new ObservablePoint3D(() => { }, undefined)) {
    let far = this.far

    // Before doing the calculations, the far clip plane is changed to the same 
    // value as distance from the camera. By doing this we can just set z value 
    // for the clip space to 1 and the desired z position will be correct.
    this.far = distance

    let invertedViewProjection = Mat4.invert(this.viewProjection, mat4)
    if (invertedViewProjection === null) {
      return
    }
    let clipSpace = Vec4.set(
      (x / this.renderer.width) * 2 - 1, ((y / this.renderer.height) * 2 - 1) * -1, 1, 1, vec4
    )
    this.far = far

    let worldSpace = Vec4.transformMat4(clipSpace, invertedViewProjection, vec4)
    worldSpace[3] = 1.0 / worldSpace[3]
    for (let i = 0; i < 3; i++) {
      worldSpace[i] *= worldSpace[3]
    }
    return point.set(worldSpace[0], worldSpace[1], worldSpace[2])
  }

  /**
   * Converts world coordinates to screen coordinates.
   * @param x World x coordinate.
   * @param y World y coordinate.
   * @param z World z coordinate.
   * @param point Point to set.
   */
  worldToScreen(x: number, y: number, z: number, point = new PIXI.Point()) {
    let worldSpace = Vec4.set(x, y, z, 1, vec4)
    let clipSpace = Vec4.transformMat4(
      Vec4.transformMat4(worldSpace, this.view, vec4), this.projection, vec4
    )
    if (clipSpace[3] !== 0) {
      for (let i = 0; i < 3; i++) {
        clipSpace[i] /= clipSpace[3]
      }
    }
    let { width, height } = this.renderer
    return point.set((clipSpace[0] + 1) / 2 * width,
      height - (clipSpace[1] + 1) / 2 * height)
  }

  private _fieldOfView = 60
  private _near = 0.1
  private _far = 1000
  private _aspect?: number

  /**
   * The aspect ratio (width divided by height). If not set, the aspect ratio of 
   * the renderer will be used by default.
   */
  get aspect() {
    return this._aspect
  }

  set aspect(value: number | undefined) {
    if (this._aspect !== value) {
      this._aspect = value; this._id++
    }
  }

  /** The vertical field of view in degrees, 60 is the default value. */
  get fieldOfView() {
    return this._fieldOfView
  }

  set fieldOfView(value: number) {
    if (this._fieldOfView !== value) {
      this._fieldOfView = value; this._id++
    }
  }

  /** The near clipping plane distance, 0.1 is the default value. */
  get near() {
    return this._near
  }

  set near(value: number) {
    if (this._near !== value) {
      this._near = value; this._id++
    }
  }

  /** The far clipping plane distance, 1000 is the default value. */
  get far() {
    return this._far
  }

  set far(value: number) {
    if (this._far !== value) {
      this._far = value; this._id++
    }
  }

  /** Returns the projection matrix. */
  get projection() {
    if (!this._projection) {
      this._projection = new MatrixComponent(this, 16, data => {
        Mat4.perspective(this._fieldOfView * (Math.PI / 180), this._aspect || this.renderer.width / this.renderer.height, this._near, this._far, data)
      })
    }
    return this._projection.array
  }

  /** Returns the target position. */
  get target() {
    if (!this._target) {
      this._target = new MatrixComponent(this, 3, data => {
        Vec3.add(this.worldTransform.position, this.worldTransform.forward, data)
      })
    }
    return this._target.array
  }

  /** Returns the view matrix. */
  get view() {
    if (!this._view) {
      this._view = new MatrixComponent(this, 16, data => {
        Mat4.lookAt(this.worldTransform.position, this.target, this.worldTransform.up, data)
      })
    }
    return this._view.array
  }

  /** Returns the view projection matrix. */
  get viewProjection() {
    if (!this._viewProjection) {
      this._viewProjection = new MatrixComponent(this, 16, data => {
        Mat4.multiply(this.projection, this.view, data)
      })
    }
    return this._viewProjection.array
  }
}

PIXI.Renderer.registerPlugin("camera", <any>Camera)