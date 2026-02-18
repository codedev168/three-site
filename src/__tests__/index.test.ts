import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';

class MockRenderer {
  domElement: HTMLCanvasElement;
  width?: number;
  height?: number;
  lastRender: any = null;
  disposed = false;
  constructor(_opts?: any) {
    this.domElement = document.createElement('canvas');
  }
  setSize(w: number, h: number) { this.width = w; this.height = h; }
  render(scene: any, camera: any) { this.lastRender = { scene, camera }; }
  dispose() { this.disposed = true; }
}

// mock the three module's WebGLRenderer before importing the module under test
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');
  return {
    ...actual,
    WebGLRenderer: MockRenderer,
  };
});

import createScene from '../index';

beforeEach(() => {
  // ensure requestAnimationFrame exists but does not auto-loop
  (globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => 1;
  (globalThis as any).cancelAnimationFrame = (_id: number) => {};
});

afterEach(() => {
  // cleanup global overrides
  delete (globalThis as any).requestAnimationFrame;
  delete (globalThis as any).cancelAnimationFrame;
});

describe('createScene', () => {
  it('returns a scene handle and appends renderer.domElement to container', () => {
    const container = document.createElement('div');
    const handle = createScene(container, {});

    expect(handle).toHaveProperty('container');
    expect(handle).toHaveProperty('renderer');
    expect(handle.renderer).toBeInstanceOf(MockRenderer);
    expect(container.querySelector('canvas')).toBe(handle.renderer.domElement);

    handle.dispose();
  });

  it('respects provided width, height and backgroundColor options', () => {
    const container = document.createElement('div');
    const opts = { width: 123, height: 456, backgroundColor: 0xff00ff };
    const handle = createScene(container, opts);

    // width/height forwarded to renderer
    expect((handle.renderer as any).width).toBe(123);
    expect((handle.renderer as any).height).toBe(456);

    // background color applied
    // scene.background is a THREE.Color
    // getHex should equal provided color
    // @ts-ignore
    expect(handle.scene.background.getHex()).toBe(0xff00ff);

    handle.dispose();
  });

  it('start triggers an initial render', () => {
    const container = document.createElement('div');
    const handle = createScene(container, {});

    handle.start();

    expect((handle.renderer as any).lastRender).toBeTruthy();

    handle.dispose();
  });

  it('dispose stops animation, disposes geometries/materials and removes DOM element', () => {
    const container = document.createElement('div');
    const handle = createScene(container, {});

    const mesh = handle.scene.children.find((c: any) => c.type === 'Mesh') as any;
    expect(mesh).toBeTruthy();

    const geomDispose = vi.spyOn(mesh.geometry, 'dispose');
    const matDispose = vi.spyOn(mesh.material, 'dispose');

    handle.dispose();

    expect(geomDispose).toHaveBeenCalled();
    expect(matDispose).toHaveBeenCalled();

    // renderer.dispose should have been called
    expect((handle.renderer as any).disposed).toBe(true);

    // DOM element removed
    expect(container.querySelector('canvas')).toBeNull();

    geomDispose.mockRestore();
    matDispose.mockRestore();
  });
});

