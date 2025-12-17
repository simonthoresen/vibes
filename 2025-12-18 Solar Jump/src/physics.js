import * as THREE from 'three';

export class Physics {
    constructor(solarSystem) {
        this.solarSystem = solarSystem;
        this.G = 5.0; // Gravitational constant (significantly increased for stronger pull)
    }

    calculateGravity(position, velocity) {
        const gravitationalForce = new THREE.Vector3();
        const bodies = this.solarSystem.getCelestialBodies();

        bodies.forEach(body => {
            const direction = new THREE.Vector3().subVectors(body.mesh.position, position);
            const distance = direction.length();
            
            if (distance < 0.1) return; // Avoid division by zero

            const forceMagnitude = (this.G * body.mass) / (distance * distance);
            direction.normalize();
            direction.multiplyScalar(forceMagnitude);
            
            gravitationalForce.add(direction);
        });

        return gravitationalForce;
    }

    isOnPlanet(position, body, threshold = 0.1) {
        const distance = position.distanceTo(body.mesh.position);
        const surfaceDistance = distance - body.radius;
        return surfaceDistance < threshold;
    }

    getGroundNormal(position, body) {
        const normal = new THREE.Vector3().subVectors(position, body.mesh.position);
        normal.normalize();
        return normal;
    }

    findStandingPlanet(position) {
        const bodies = this.solarSystem.getCelestialBodies();
        
        for (const body of bodies) {
            if (this.isOnPlanet(position, body, 0.5)) {
                return body;
            }
        }
        
        return null;
    }

    checkPlanetCollision(oldPosition, newPosition, radius = 0.5) {
        const bodies = this.solarSystem.getCelestialBodies();
        
        for (const body of bodies) {
            const distance = newPosition.distanceTo(body.mesh.position);
            const collisionDistance = body.radius + radius;
            
            if (distance < collisionDistance) {
                // Calculate collision point
                const direction = new THREE.Vector3().subVectors(newPosition, body.mesh.position);
                direction.normalize();
                direction.multiplyScalar(collisionDistance);
                
                const correctedPosition = new THREE.Vector3().addVectors(body.mesh.position, direction);
                return { collided: true, position: correctedPosition, body: body };
            }
        }
        
        return { collided: false };
    }
}
