import * as THREE from 'three';

export function createToonMaterial(color) {
    // Using MeshToonMaterial for built-in cel shading support
    // This requires a gradient map for best effect, but we'll start simple

    // Create a simple gradient map programmatically
    const format = THREE.RGBAFormat;
    const data = new Uint8Array(4 * 4);

    // 4 steps of shading: Dark -> Light
    // 1: Darkest
    data[0] = 64; data[1] = 64; data[2] = 64; data[3] = 255;
    // 2
    data[4] = 128; data[5] = 128; data[6] = 128; data[7] = 255;
    // 3
    data[8] = 192; data[9] = 192; data[10] = 192; data[11] = 255;
    // 4: Lightest
    data[12] = 255; data[13] = 255; data[14] = 255; data[15] = 255;

    const gradientMap = new THREE.DataTexture(data, 4, 1, format);
    gradientMap.needsUpdate = true;
    gradientMap.minFilter = THREE.NearestFilter;
    gradientMap.magFilter = THREE.NearestFilter;

    return new THREE.MeshToonMaterial({
        color: color,
        gradientMap: gradientMap,
    });
}
