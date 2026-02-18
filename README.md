# @codedev168/three-site

A minimal Three.js helper to quickly create and animate a basic scene with a rotating cube.

Installation

npm install @codedev168/three-site three

Usage

import createScene from '@codedev168/three-site';

const container = document.getElementById('app');
const scene = createScene(container);
scene.start();

You can call scene.stop() to pause the animation and scene.dispose() to clean up resources.
