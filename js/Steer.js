
EntityHelper = function (entity) {

    THREE.Group.apply(this);

    this.entity=entity;

    this.forward = new THREE.ArrowHelper(this.entity.forward, this.entity.position, 200, 0xFF0000)
    this.backward = new THREE.ArrowHelper(this.entity.backward, this.entity.position, 200, 0x0000FF)
    this.left = new THREE.ArrowHelper(this.entity.left, this.entity.position, 200, 0x0000FF)
    this.right = new THREE.ArrowHelper(this.entity.right, this.entity.position, 200, 0x0000FF)
    this.velocity = new THREE.ArrowHelper(this.entity.velocity.clone().normalize(), this.entity.position, 10, 0x00FF00)

    this.add(this.forward)
    this.add(this.backward)
    this.add(this.left)
    this.add(this.right)
    this.add(this.velocity)


}

EntityHelper.prototype = Object.assign(Object.create(THREE.Group.prototype), {
    constructor: EntityHelper,

    update: function () {
        this.velocity.setDirection(this.entity.velocity.clone().normalize())
        this.velocity.setLength(this.entity.velocity.length()*50)
    }
});


Entity = function (mesh) {

    THREE.Group.apply(this);

    this.mass = 1
    this.maxSpeed = 10

    this.position = new THREE.Vector3(0, 0, 0)//!!!!!
    this.velocity = new THREE.Vector3(0, 0, 0)
    this.box = new THREE.Box3().setFromObject(mesh);



    //helpers


    Object.defineProperty(Entity.prototype, 'width', {
        enumerable: true,
        configurable: true,
        get: function () {
            return (this.box.max.x - this.box.min.x)
        }

    });

    Object.defineProperty(Entity.prototype, 'height', {
        enumerable: true,
        configurable: true,
        get: function () {
            return (this.box.max.y - this.box.min.y)
        }

    });

    Object.defineProperty(Entity.prototype, 'depth', {
        enumerable: true,
        configurable: true,
        get: function () {
            return (this.box.max.z - this.box.min.z)
        }

    });

    Object.defineProperty(Entity.prototype, 'forward', {
        enumerable: true,
        configurable: true,
        get: function () {
            return new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion).negate()
        }

    });

    Object.defineProperty(Entity.prototype, 'backward', {
        enumerable: true,
        configurable: true,
        get: function () {
            return this.forward.clone().negate()
        }

    });

    Object.defineProperty(Entity.prototype, 'left', {
        enumerable: true,
        configurable: true,
        get: function () {
            return this.forward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * .5)
        }

    });

    Object.defineProperty(Entity.prototype, 'right', {
        enumerable: true,
        configurable: true,
        get: function () {
            return this.left.clone().negate()
        }

    });

    this.add(mesh)
    this.helper=new EntityHelper(this)
    this.add(this.helper);

}

Entity.prototype = Object.assign(Object.create(THREE.Group.prototype), {
    constructor: Entity,

    update: function () {
        this.velocity.clampLength(0, this.maxSpeed)
        this.position.add(this.velocity)
        this.helper.update()
    }
});

SteeringEntity = function (mesh) {
    Entity.call(this, mesh);

    this.maxForce = 1;
    this.arrivalThreshold = 100;
    this.wanderAngle = 0
    this.wanderDistance = 10;
    this.wanderRadius = 5;
    this.wanderRange = 1;
    this.avoidDistance = 300
    this.avoidBuffer = 20
    this.steeringForce = new THREE.Vector3(0, 0, 0);
}

SteeringEntity.prototype = Object.assign(Object.create(Entity.prototype), {

    constructor: SteeringEntity,

    seek: function (target) {
        var desiredVelocity = target.clone().sub(this.position);
        desiredVelocity.normalize().setLength(this.maxSpeed).sub(this.velocity);
        this.steeringForce.add(desiredVelocity);
    },

    flee: function (target) {
        var desiredVelocity = target.clone().sub(this.position);
        desiredVelocity.normalize().setLength(this.maxSpeed).sub(this.velocity);
        this.steeringForce.sub(desiredVelocity);
    },

    arrive: function (target) {
        var desiredVelocity = target.clone().sub(this.position);
        desiredVelocity.normalize()
        var distance = this.position.distanceTo(target)
        if (distance > this.arrivalThreshold)
            desiredVelocity.setLength(this.maxSpeed)
        else
            desiredVelocity.setLength(this.maxSpeed * distance / this.arrivalThreshold)
        desiredVelocity.sub(this.velocity);
        this.steeringForce.add(desiredVelocity);
    },

    pursue: function (target) {
        var lookAheadTime = this.position.distanceTo(target.position) / this.maxSpeed;
        var predictedTarget = target.position.clone().add(target.velocity.clone().setLength(lookAheadTime));
        this.seek(predictedTarget);
    },

    evade: function (target) {
        var lookAheadTime = this.position.distanceTo(target.position) / this.maxSpeed;
        var predictedTarget = target.position.clone().sub(target.velocity.clone().setLength(lookAheadTime));
        this.flee(predictedTarget);
    },

    wander: function () //TODO: specify axis
    {
        var center = this.velocity.clone().normalize().setLength(this.wanderDistance);
        var offset = new THREE.Vector3(1, 1, 1);
        offset.setLength(this.wanderRadius);


        offset.x = Math.sin(this.wanderAngle) * offset.length()
        offset.z = Math.cos(this.wanderAngle) * offset.length()
        offset.y = Math.sin(this.wanderAngle) * offset.length()

        this.wanderAngle += Math.random() * this.wanderRange - this.wanderRange * .5;
        center.add(offset)
        this.steeringForce.add(center);
    },

    avoid: function (entities) {
        for (var i = 0; i < entities.length; i++) {

            //vector between obstacle and this
            var heading = this.velocity.clone().normalize();
            var difference = entities[i].position.clone().sub(this.position)
            var dot = difference.dot(heading)
            //if obstacle is in front of this
            if (dot > 0) {
                var feeler = heading.clone().setLength(this.avoidDistance)
                var projection = heading.clone().setLength(dot);
                var distance = projection.clone().sub(difference).length();
                if (distance < 250 + this.avoidBuffer && projection.length() < feeler.length())//radius
                {
                    //calculate a force +/- 90 degrees from vector to obstacle
                    var force = heading.clone().setLength(this.maxSpeed)
                    force.x = Math.cos(this.wanderAngle) * offset.length()
                    force.z = Math.sin(this.wanderAngle) * offset.length()
                    force.y = Math.sin(this.wanderAngle) * offset.length()
                }
            }
        }
    },


    update: function () {
        this.steeringForce.clampLength(0, this.maxForce)
        this.steeringForce.divideScalar(this.mass);
        this.velocity.add(this.steeringForce)
        this.steeringForce.set(0, 0, 0)
        Entity.prototype.update.call(this);
    }
});


/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

THREE.Vector3.prototype.setAngle = function (value) {
    this.x = Math.cos(value) * this.length()
    this.z = Math.sin(value) * this.length()
    this.y = Math.sin(value) * this.length()
}






