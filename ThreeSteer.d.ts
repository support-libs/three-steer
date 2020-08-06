declare module "three-steer" {

  import * as THREE from 'three';

  export class Entity extends THREE.Group {

    constructor(mesh: THREE.Mesh);

    mesh: THREE.Mesh;
    mass: number;
    maxSpeed: number;

    position: THREE.Vector3;
    velocity: THREE.Vector3;

    box: THREE.Box3;
    raycaster: THREE.Raycaster;

    velocitySamples: Array<THREE.Vector3>;
    numSamplesForSmoothing: number;

    // width: number;
    // height: number;
    // depth: number;
    // forward: number;
    // backward: number;
    // left: number;
    // right: number;

    radius: number;
  }

  export class SteeringEntity extends Entity {
    constructor(mesh: THREE.Mesh);

    maxForce: number;
    arrivalThreshold: number;

    wanderAngle: number;
    wanderDistance: number;
    wanderRadius: number;
    wanderRange: number;

    avoidDistance: number;
    avoidBuffer: number;

    inSightDistance: number;
    tooCloseDistance: number;

    pathIndex: number;

    steeringForce: THREE.Vector3;

    seek(position: THREE.Vector3): void;

    flee(position: THREE.Vector3): void;

    arrive(position: THREE.Vector3): void;

    pursue(target: Entity): void;

    evade(target: Entity): void;

    idle(): void;

    wander(): void;

    interpose(targetA: Entity, targetB: Entity): void;

    separation(entities: Array<Entity>, separationRadius: number, maxSeparation: number): void;

    isOnLeaderSight(leader: Entity, ahead: any, leaderSightRadius: any): any;

    followLeader(leader: Entity, entities: any, distance: number, separationRadius: number, maxSeparation: number, leaderSightRadius: number, arrivalThreshold: number): void;

    getNeighborAhead(entities: Array<Entity>): Entity;

    queue(entities: Entity, maxQueueRadius: number): void;

    inSight(entity: Entity): boolean;

    flock(entities: Array<Entity>): void;

    followPath(path: any, loop: any, thresholdRadius: number): void;

    avoid(obstacles: Array<Entity>): void;

    update(): void;
  }

}

interface Window {
  THREE: any
}