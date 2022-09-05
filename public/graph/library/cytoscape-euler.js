(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["cytoscapeEuler"] = factory();
	else
		root["cytoscapeEuler"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 11);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = Object.assign != null ? Object.assign.bind(Object) : function (tgt) {
  for (var _len = arguments.length, srcs = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    srcs[_key - 1] = arguments[_key];
  }

  srcs.forEach(function (src) {
    Object.keys(src).forEach(function (k) {
      return tgt[k] = src[k];
    });
  });

  return tgt;
};

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var assign = __webpack_require__(0);

var defaults = Object.freeze({
  source: null,
  target: null,
  length: 80,
  coeff: 0.0002,
  weight: 1
});

function makeSpring(spring) {
  return assign({}, defaults, spring);
}

function applySpring(spring) {
  var body1 = spring.source,
      body2 = spring.target,
      length = spring.length < 0 ? defaults.length : spring.length,
      dx = body2.pos.x - body1.pos.x,
      dy = body2.pos.y - body1.pos.y,
      r = Math.sqrt(dx * dx + dy * dy);

  if (r === 0) {
    dx = (Math.random() - 0.5) / 50;
    dy = (Math.random() - 0.5) / 50;
    r = Math.sqrt(dx * dx + dy * dy);
  }

  var d = r - length;
  var coeff = (!spring.coeff || spring.coeff < 0 ? defaults.springCoeff : spring.coeff) * d / r * spring.weight;

  body1.force.x += coeff * dx;
  body1.force.y += coeff * dy;

  body2.force.x -= coeff * dx;
  body2.force.y -= coeff * dy;
}

module.exports = { makeSpring: makeSpring, applySpring: applySpring };

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
The implementation of the Euler layout algorithm
*/

var Layout = __webpack_require__(13);
var assign = __webpack_require__(0);
var defaults = __webpack_require__(4);

var _require = __webpack_require__(10),
    _tick = _require.tick;

var _require2 = __webpack_require__(7),
    makeQuadtree = _require2.makeQuadtree;

var _require3 = __webpack_require__(3),
    makeBody = _require3.makeBody;

var _require4 = __webpack_require__(1),
    makeSpring = _require4.makeSpring;

var isFn = function isFn(fn) {
  return typeof fn === 'function';
};
var isParent = function isParent(n) {
  return n.isParent();
};
var notIsParent = function notIsParent(n) {
  return !isParent(n);
};
var isLocked = function isLocked(n) {
  return n.locked();
};
var notIsLocked = function notIsLocked(n) {
  return !isLocked(n);
};
var isParentEdge = function isParentEdge(e) {
  return isParent(e.source()) || isParent(e.target());
};
var notIsParentEdge = function notIsParentEdge(e) {
  return !isParentEdge(e);
};
var getBody = function getBody(n) {
  return n.scratch('euler').body;
};
var getNonParentDescendants = function getNonParentDescendants(n) {
  return isParent(n) ? n.descendants().filter(notIsParent) : n;
};

var getScratch = function getScratch(el) {
  var scratch = el.scratch('euler');

  if (!scratch) {
    scratch = {};

    el.scratch('euler', scratch);
  }

  return scratch;
};

var optFn = function optFn(opt, ele) {
  if (isFn(opt)) {
    return opt(ele);
  } else {
    return opt;
  }
};

var Euler = function (_Layout) {
  _inherits(Euler, _Layout);

  function Euler(options) {
    _classCallCheck(this, Euler);

    return _possibleConstructorReturn(this, (Euler.__proto__ || Object.getPrototypeOf(Euler)).call(this, assign({}, defaults, options)));
  }

  _createClass(Euler, [{
    key: 'prerun',
    value: function prerun(state) {
      var s = state;

      s.quadtree = makeQuadtree();

      var bodies = s.bodies = [];

      // regular nodes
      s.nodes.filter(function (n) {
        return notIsParent(n);
      }).forEach(function (n) {
        var scratch = getScratch(n);

        var body = makeBody({
          pos: { x: scratch.x, y: scratch.y },
          mass: optFn(s.mass, n),
          locked: scratch.locked
        });

        body._cyNode = n;

        scratch.body = body;

        body._scratch = scratch;

        bodies.push(body);
      });

      var springs = s.springs = [];

      // regular edge springs
      s.edges.filter(notIsParentEdge).forEach(function (e) {
        var spring = makeSpring({
          source: getBody(e.source()),
          target: getBody(e.target()),
          length: optFn(s.springLength, e),
          coeff: optFn(s.springCoeff, e)
        });

        spring._cyEdge = e;

        var scratch = getScratch(e);

        spring._scratch = scratch;

        scratch.spring = spring;

        springs.push(spring);
      });

      // compound edge springs
      s.edges.filter(isParentEdge).forEach(function (e) {
        var sources = getNonParentDescendants(e.source());
        var targets = getNonParentDescendants(e.target());

        // just add one spring for perf
        sources = [sources[0]];
        targets = [targets[0]];

        sources.forEach(function (src) {
          targets.forEach(function (tgt) {
            springs.push(makeSpring({
              source: getBody(src),
              target: getBody(tgt),
              length: optFn(s.springLength, e),
              coeff: optFn(s.springCoeff, e)
            }));
          });
        });
      });
    }
  }, {
    key: 'tick',
    value: function tick(state) {
      var movement = _tick(state);

      var isDone = movement <= state.movementThreshold;

      return isDone;
    }
  }]);

  return Euler;
}(Layout);

module.exports = Euler;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var defaults = Object.freeze({
  pos: { x: 0, y: 0 },
  prevPos: { x: 0, y: 0 },
  force: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  mass: 1
});

var copyVec = function copyVec(v) {
  return { x: v.x, y: v.y };
};
var getValue = function getValue(val, def) {
  return val != null ? val : def;
};
var getVec = function getVec(vec, def) {
  return copyVec(getValue(vec, def));
};

function makeBody(opts) {
  var b = {};

  b.pos = getVec(opts.pos, defaults.pos);
  b.prevPos = getVec(opts.prevPos, b.pos);
  b.force = getVec(opts.force, defaults.force);
  b.velocity = getVec(opts.velocity, defaults.velocity);
  b.mass = opts.mass != null ? opts.mass : defaults.mass;
  b.locked = opts.locked;

  return b;
}

module.exports = { makeBody: makeBody };

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var defaults = Object.freeze({
  // The ideal legth of a spring
  // - This acts as a hint for the edge length
  // - The edge length can be longer or shorter if the forces are set to extreme values
  springLength: function springLength(edge) {
    return 80;
  },

  // Hooke's law coefficient
  // - The value ranges on [0, 1]
  // - Lower values give looser springs
  // - Higher values give tighter springs
  springCoeff: function springCoeff(edge) {
    return 0.0008;
  },

  // The mass of the node in the physics simulation
  // - The mass affects the gravity node repulsion/attraction
  mass: function mass(node) {
    return 4;
  },

  // Coulomb's law coefficient
  // - Makes the nodes repel each other for negative values
  // - Makes the nodes attract each other for positive values
  gravity: -1.2,

  // A force that pulls nodes towards the origin (0, 0)
  // Higher values keep the components less spread out
  pull: 0.001,

  // Theta coefficient from Barnes-Hut simulation
  // - Value ranges on [0, 1]
  // - Performance is better with smaller values
  // - Very small values may not create enough force to give a good result
  theta: 0.666,

  // Friction / drag coefficient to make the system stabilise over time
  dragCoeff: 0.02,

  // When the total of the squared position deltas is less than this value, the simulation ends
  movementThreshold: 1,

  // The amount of time passed per tick
  // - Larger values result in faster runtimes but might spread things out too far
  // - Smaller values produce more accurate results
  timeStep: 20
});

module.exports = defaults;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var defaultCoeff = 0.02;

function applyDrag(body, manualDragCoeff) {
  var dragCoeff = void 0;

  if (manualDragCoeff != null) {
    dragCoeff = manualDragCoeff;
  } else if (body.dragCoeff != null) {
    dragCoeff = body.dragCoeff;
  } else {
    dragCoeff = defaultCoeff;
  }

  body.force.x -= dragCoeff * body.velocity.x;
  body.force.y -= dragCoeff * body.velocity.y;
}

module.exports = { applyDrag: applyDrag };

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// use euler method for force integration http://en.wikipedia.org/wiki/Euler_method
// return sum of squared position deltas
function integrate(bodies, timeStep) {
  var dx = 0,
      tx = 0,
      dy = 0,
      ty = 0,
      i,
      max = bodies.length;

  if (max === 0) {
    return 0;
  }

  for (i = 0; i < max; ++i) {
    var body = bodies[i],
        coeff = timeStep / body.mass;

    if (body.grabbed) {
      continue;
    }

    if (body.locked) {
      body.velocity.x = 0;
      body.velocity.y = 0;
    } else {
      body.velocity.x += coeff * body.force.x;
      body.velocity.y += coeff * body.force.y;
    }

    var vx = body.velocity.x,
        vy = body.velocity.y,
        v = Math.sqrt(vx * vx + vy * vy);

    if (v > 1) {
      body.velocity.x = vx / v;
      body.velocity.y = vy / v;
    }

    dx = timeStep * body.velocity.x;
    dy = timeStep * body.velocity.y;

    body.pos.x += dx;
    body.pos.y += dy;

    tx += Math.abs(dx);ty += Math.abs(dy);
  }

  return (tx * tx + ty * ty) / max;
}

module.exports = { integrate: integrate };

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// impl of barnes hut
// http://www.eecs.berkeley.edu/~demmel/cs267/lecture26/lecture26.html
// http://en.wikipedia.org/wiki/Barnes%E2%80%93Hut_simulation

var Node = __webpack_require__(9);
var InsertStack = __webpack_require__(8);

var resetVec = function resetVec(v) {
  v.x = 0;v.y = 0;
};

var isSamePosition = function isSamePosition(p1, p2) {
  var threshold = 1e-8;
  var dx = Math.abs(p1.x - p2.x);
  var dy = Math.abs(p1.y - p2.y);

  return dx < threshold && dy < threshold;
};

function makeQuadtree() {
  var updateQueue = [],
      insertStack = new InsertStack(),
      nodesCache = [],
      currentInCache = 0,
      root = newNode();

  function newNode() {
    // To avoid pressure on GC we reuse nodes.
    var node = nodesCache[currentInCache];
    if (node) {
      node.quad0 = null;
      node.quad1 = null;
      node.quad2 = null;
      node.quad3 = null;
      node.body = null;
      node.mass = node.massX = node.massY = 0;
      node.left = node.right = node.top = node.bottom = 0;
    } else {
      node = new Node();
      nodesCache[currentInCache] = node;
    }

    ++currentInCache;
    return node;
  }

  function update(sourceBody, gravity, theta, pull) {
    var queue = updateQueue,
        v = void 0,
        dx = void 0,
        dy = void 0,
        r = void 0,
        fx = 0,
        fy = 0,
        queueLength = 1,
        shiftIdx = 0,
        pushIdx = 1;

    queue[0] = root;

    resetVec(sourceBody.force);

    var px = -sourceBody.pos.x;
    var py = -sourceBody.pos.y;
    var pr = Math.sqrt(px * px + py * py);
    var pv = sourceBody.mass * pull / pr;

    fx += pv * px;
    fy += pv * py;

    while (queueLength) {
      var node = queue[shiftIdx],
          body = node.body;

      queueLength -= 1;
      shiftIdx += 1;
      var differentBody = body !== sourceBody;
      if (body && differentBody) {
        // If the current node is a leaf node (and it is not source body),
        // calculate the force exerted by the current node on body, and add this
        // amount to body's net force.
        dx = body.pos.x - sourceBody.pos.x;
        dy = body.pos.y - sourceBody.pos.y;
        r = Math.sqrt(dx * dx + dy * dy);

        if (r === 0) {
          // Poor man's protection against zero distance.
          dx = (Math.random() - 0.5) / 50;
          dy = (Math.random() - 0.5) / 50;
          r = Math.sqrt(dx * dx + dy * dy);
        }

        // This is standard gravition force calculation but we divide
        // by r^3 to save two operations when normalizing force vector.
        v = gravity * body.mass * sourceBody.mass / (r * r * r);
        fx += v * dx;
        fy += v * dy;
      } else if (differentBody) {
        // Otherwise, calculate the ratio s / r,  where s is the width of the region
        // represented by the internal node, and r is the distance between the body
        // and the node's center-of-mass
        dx = node.massX / node.mass - sourceBody.pos.x;
        dy = node.massY / node.mass - sourceBody.pos.y;
        r = Math.sqrt(dx * dx + dy * dy);

        if (r === 0) {
          // Sorry about code duplucation. I don't want to create many functions
          // right away. Just want to see performance first.
          dx = (Math.random() - 0.5) / 50;
          dy = (Math.random() - 0.5) / 50;
          r = Math.sqrt(dx * dx + dy * dy);
        }
        // If s / r < θ, treat this internal node as a single body, and calculate the
        // force it exerts on sourceBody, and add this amount to sourceBody's net force.
        if ((node.right - node.left) / r < theta) {
          // in the if statement above we consider node's width only
          // because the region was squarified during tree creation.
          // Thus there is no difference between using width or height.
          v = gravity * node.mass * sourceBody.mass / (r * r * r);
          fx += v * dx;
          fy += v * dy;
        } else {
          // Otherwise, run the procedure recursively on each of the current node's children.

          // I intentionally unfolded this loop, to save several CPU cycles.
          if (node.quad0) {
            queue[pushIdx] = node.quad0;
            queueLength += 1;
            pushIdx += 1;
          }
          if (node.quad1) {
            queue[pushIdx] = node.quad1;
            queueLength += 1;
            pushIdx += 1;
          }
          if (node.quad2) {
            queue[pushIdx] = node.quad2;
            queueLength += 1;
            pushIdx += 1;
          }
          if (node.quad3) {
            queue[pushIdx] = node.quad3;
            queueLength += 1;
            pushIdx += 1;
          }
        }
      }
    }

    sourceBody.force.x += fx;
    sourceBody.force.y += fy;
  }

  function insertBodies(bodies) {
    if (bodies.length === 0) {
      return;
    }

    var x1 = Number.MAX_VALUE,
        y1 = Number.MAX_VALUE,
        x2 = Number.MIN_VALUE,
        y2 = Number.MIN_VALUE,
        i = void 0,
        max = bodies.length;

    // To reduce quad tree depth we are looking for exact bounding box of all particles.
    i = max;
    while (i--) {
      var x = bodies[i].pos.x;
      var y = bodies[i].pos.y;
      if (x < x1) {
        x1 = x;
      }
      if (x > x2) {
        x2 = x;
      }
      if (y < y1) {
        y1 = y;
      }
      if (y > y2) {
        y2 = y;
      }
    }

    // Squarify the bounds.
    var dx = x2 - x1,
        dy = y2 - y1;
    if (dx > dy) {
      y2 = y1 + dx;
    } else {
      x2 = x1 + dy;
    }

    currentInCache = 0;
    root = newNode();
    root.left = x1;
    root.right = x2;
    root.top = y1;
    root.bottom = y2;

    i = max - 1;
    if (i >= 0) {
      root.body = bodies[i];
    }
    while (i--) {
      insert(bodies[i], root);
    }
  }

  function insert(newBody) {
    insertStack.reset();
    insertStack.push(root, newBody);

    while (!insertStack.isEmpty()) {
      var stackItem = insertStack.pop(),
          node = stackItem.node,
          body = stackItem.body;

      if (!node.body) {
        // This is internal node. Update the total mass of the node and center-of-mass.
        var x = body.pos.x;
        var y = body.pos.y;
        node.mass = node.mass + body.mass;
        node.massX = node.massX + body.mass * x;
        node.massY = node.massY + body.mass * y;

        // Recursively insert the body in the appropriate quadrant.
        // But first find the appropriate quadrant.
        var quadIdx = 0,
            // Assume we are in the 0's quad.
        left = node.left,
            right = (node.right + left) / 2,
            top = node.top,
            bottom = (node.bottom + top) / 2;

        if (x > right) {
          // somewhere in the eastern part.
          quadIdx = quadIdx + 1;
          left = right;
          right = node.right;
        }
        if (y > bottom) {
          // and in south.
          quadIdx = quadIdx + 2;
          top = bottom;
          bottom = node.bottom;
        }

        var child = getChild(node, quadIdx);
        if (!child) {
          // The node is internal but this quadrant is not taken. Add
          // subnode to it.
          child = newNode();
          child.left = left;
          child.top = top;
          child.right = right;
          child.bottom = bottom;
          child.body = body;

          setChild(node, quadIdx, child);
        } else {
          // continue searching in this quadrant.
          insertStack.push(child, body);
        }
      } else {
        // We are trying to add to the leaf node.
        // We have to convert current leaf into internal node
        // and continue adding two nodes.
        var oldBody = node.body;
        node.body = null; // internal nodes do not cary bodies

        if (isSamePosition(oldBody.pos, body.pos)) {
          // Prevent infinite subdivision by bumping one node
          // anywhere in this quadrant
          var retriesCount = 3;
          do {
            var offset = Math.random();
            var dx = (node.right - node.left) * offset;
            var dy = (node.bottom - node.top) * offset;

            oldBody.pos.x = node.left + dx;
            oldBody.pos.y = node.top + dy;
            retriesCount -= 1;
            // Make sure we don't bump it out of the box. If we do, next iteration should fix it
          } while (retriesCount > 0 && isSamePosition(oldBody.pos, body.pos));

          if (retriesCount === 0 && isSamePosition(oldBody.pos, body.pos)) {
            // This is very bad, we ran out of precision.
            // if we do not return from the method we'll get into
            // infinite loop here. So we sacrifice correctness of layout, and keep the app running
            // Next layout iteration should get larger bounding box in the first step and fix this
            return;
          }
        }
        // Next iteration should subdivide node further.
        insertStack.push(node, oldBody);
        insertStack.push(node, body);
      }
    }
  }

  return {
    insertBodies: insertBodies,
    updateBodyForce: update
  };
}

function getChild(node, idx) {
  if (idx === 0) return node.quad0;
  if (idx === 1) return node.quad1;
  if (idx === 2) return node.quad2;
  if (idx === 3) return node.quad3;
  return null;
}

function setChild(node, idx, child) {
  if (idx === 0) node.quad0 = child;else if (idx === 1) node.quad1 = child;else if (idx === 2) node.quad2 = child;else if (idx === 3) node.quad3 = child;
}

module.exports = { makeQuadtree: makeQuadtree };

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = InsertStack;

/**
 * Our implmentation of QuadTree is non-recursive to avoid GC hit
 * This data structure represent stack of elements
 * which we are trying to insert into quad tree.
 */
function InsertStack() {
    this.stack = [];
    this.popIdx = 0;
}

InsertStack.prototype = {
    isEmpty: function isEmpty() {
        return this.popIdx === 0;
    },
    push: function push(node, body) {
        var item = this.stack[this.popIdx];
        if (!item) {
            // we are trying to avoid memory pressue: create new element
            // only when absolutely necessary
            this.stack[this.popIdx] = new InsertStackElement(node, body);
        } else {
            item.node = node;
            item.body = body;
        }
        ++this.popIdx;
    },
    pop: function pop() {
        if (this.popIdx > 0) {
            return this.stack[--this.popIdx];
        }
    },
    reset: function reset() {
        this.popIdx = 0;
    }
};

function InsertStackElement(node, body) {
    this.node = node; // QuadTree node
    this.body = body; // physical body which needs to be inserted to node
}

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Internal data structure to represent 2D QuadTree node
 */
module.exports = function Node() {
  // body stored inside this node. In quad tree only leaf nodes (by construction)
  // contain boides:
  this.body = null;

  // Child nodes are stored in quads. Each quad is presented by number:
  // 0 | 1
  // -----
  // 2 | 3
  this.quad0 = null;
  this.quad1 = null;
  this.quad2 = null;
  this.quad3 = null;

  // Total mass of current node
  this.mass = 0;

  // Center of mass coordinates
  this.massX = 0;
  this.massY = 0;

  // bounding box coordinates
  this.left = 0;
  this.top = 0;
  this.bottom = 0;
  this.right = 0;
};

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _require = __webpack_require__(6),
    integrate = _require.integrate;

var _require2 = __webpack_require__(5),
    applyDrag = _require2.applyDrag;

var _require3 = __webpack_require__(1),
    applySpring = _require3.applySpring;

function tick(_ref) {
  var bodies = _ref.bodies,
      springs = _ref.springs,
      quadtree = _ref.quadtree,
      timeStep = _ref.timeStep,
      gravity = _ref.gravity,
      theta = _ref.theta,
      dragCoeff = _ref.dragCoeff,
      pull = _ref.pull;

  // update body from scratch in case of any changes
  bodies.forEach(function (body) {
    var p = body._scratch;

    if (!p) {
      return;
    }

    body.locked = p.locked;
    body.grabbed = p.grabbed;
    body.pos.x = p.x;
    body.pos.y = p.y;
  });

  quadtree.insertBodies(bodies);

  for (var i = 0; i < bodies.length; i++) {
    var body = bodies[i];

    quadtree.updateBodyForce(body, gravity, theta, pull);
    applyDrag(body, dragCoeff);
  }

  for (var _i = 0; _i < springs.length; _i++) {
    var spring = springs[_i];

    applySpring(spring);
  }

  var movement = integrate(bodies, timeStep);

  // update scratch positions from body positions
  bodies.forEach(function (body) {
    var p = body._scratch;

    if (!p) {
      return;
    }

    p.x = body.pos.x;
    p.y = body.pos.y;
  });

  return movement;
}

module.exports = { tick: tick };

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Euler = __webpack_require__(2);

// registers the extension on a cytoscape lib ref
var register = function register(cytoscape) {
  if (!cytoscape) {
    return;
  } // can't register if cytoscape unspecified

  cytoscape('layout', 'euler', Euler); // register with cytoscape.js
};

if (typeof cytoscape !== 'undefined') {
  // expose to global cytoscape (i.e. window.cytoscape)
  register(cytoscape);
}

module.exports = register;

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// general default options for force-directed layout

module.exports = Object.freeze({
  animate: true, // whether to show the layout as it's running; special 'end' value makes the layout animate like a discrete layout
  refresh: 10, // number of ticks per frame; higher is faster but more jerky
  maxIterations: 1000, // max iterations before the layout will bail out
  maxSimulationTime: 4000, // max length in ms to run the layout
  ungrabifyWhileSimulating: false, // so you can't drag nodes during layout
  fit: true, // on every layout reposition of nodes, fit the viewport
  padding: 30, // padding around the simulation
  boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }

  // layout event callbacks
  ready: function ready() {}, // on layoutready
  stop: function stop() {}, // on layoutstop

  // positioning options
  randomize: false, // use random node positions at beginning of layout

  // infinite layout options
  infinite: false // overrides all other options for a forces-all-the-time mode
});

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
A generic continuous layout class
*/

var assign = __webpack_require__(0);
var defaults = __webpack_require__(12);
var makeBoundingBox = __webpack_require__(14);

var _require = __webpack_require__(15),
    setInitialPositionState = _require.setInitialPositionState,
    refreshPositions = _require.refreshPositions,
    getNodePositionData = _require.getNodePositionData;

var _require2 = __webpack_require__(16),
    multitick = _require2.multitick;

var Layout = function () {
  function Layout(options) {
    _classCallCheck(this, Layout);

    var o = this.options = assign({}, defaults, options);

    var s = this.state = assign({}, o, {
      layout: this,
      nodes: o.eles.nodes(),
      edges: o.eles.edges(),
      tickIndex: 0,
      firstUpdate: true
    });

    s.animateEnd = o.animate && o.animate === 'end';
    s.animateContinuously = o.animate && !s.animateEnd;
  }

  _createClass(Layout, [{
    key: 'run',
    value: function run() {
      var l = this;
      var s = this.state;

      s.tickIndex = 0;
      s.firstUpdate = true;
      s.startTime = Date.now();
      s.running = true;

      s.currentBoundingBox = makeBoundingBox(s.boundingBox, s.cy);

      if (s.ready) {
        l.one('ready', s.ready);
      }
      if (s.stop) {
        l.one('stop', s.stop);
      }

      s.nodes.forEach(function (n) {
        return setInitialPositionState(n, s);
      });

      l.prerun(s);

      if (s.animateContinuously) {
        var ungrabify = function ungrabify(node) {
          if (!s.ungrabifyWhileSimulating) {
            return;
          }

          var grabbable = getNodePositionData(node, s).grabbable = node.grabbable();

          if (grabbable) {
            node.ungrabify();
          }
        };

        var regrabify = function regrabify(node) {
          if (!s.ungrabifyWhileSimulating) {
            return;
          }

          var grabbable = getNodePositionData(node, s).grabbable;

          if (grabbable) {
            node.grabify();
          }
        };

        var updateGrabState = function updateGrabState(node) {
          return getNodePositionData(node, s).grabbed = node.grabbed();
        };

        var onGrab = function onGrab(_ref) {
          var target = _ref.target;

          updateGrabState(target);
        };

        var onFree = onGrab;

        var onDrag = function onDrag(_ref2) {
          var target = _ref2.target;

          var p = getNodePositionData(target, s);
          var tp = target.position();

          p.x = tp.x;
          p.y = tp.y;
        };

        var listenToGrab = function listenToGrab(node) {
          node.on('grab', onGrab);
          node.on('free', onFree);
          node.on('drag', onDrag);
        };

        var unlistenToGrab = function unlistenToGrab(node) {
          node.removeListener('grab', onGrab);
          node.removeListener('free', onFree);
          node.removeListener('drag', onDrag);
        };

        var fit = function fit() {
          if (s.fit && s.animateContinuously) {
            s.cy.fit(s.padding);
          }
        };

        var onNotDone = function onNotDone() {
          refreshPositions(s.nodes, s);
          fit();

          requestAnimationFrame(_frame);
        };

        var _frame = function _frame() {
          multitick(s, onNotDone, _onDone);
        };

        var _onDone = function _onDone() {
          refreshPositions(s.nodes, s);
          fit();

          s.nodes.forEach(function (n) {
            regrabify(n);
            unlistenToGrab(n);
          });

          s.running = false;

          l.emit('layoutstop');
        };

        l.emit('layoutstart');

        s.nodes.forEach(function (n) {
          ungrabify(n);
          listenToGrab(n);
        });

        _frame(); // kick off
      } else {
        var done = false;
        var _onNotDone = function _onNotDone() {};
        var _onDone2 = function _onDone2() {
          return done = true;
        };

        while (!done) {
          multitick(s, _onNotDone, _onDone2);
        }

        s.eles.layoutPositions(this, s, function (node) {
          var pd = getNodePositionData(node, s);

          return { x: pd.x, y: pd.y };
        });
      }

      l.postrun(s);

      return this; // chaining
    }
  }, {
    key: 'prerun',
    value: function prerun() {}
  }, {
    key: 'postrun',
    value: function postrun() {}
  }, {
    key: 'tick',
    value: function tick() {}
  }, {
    key: 'stop',
    value: function stop() {
      this.state.running = false;

      return this; // chaining
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      return this; // chaining
    }
  }]);

  return Layout;
}();

module.exports = Layout;

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function (bb, cy) {
  if (bb == null) {
    bb = { x1: 0, y1: 0, w: cy.width(), h: cy.height() };
  } else {
    // copy
    bb = { x1: bb.x1, x2: bb.x2, y1: bb.y1, y2: bb.y2, w: bb.w, h: bb.h };
  }

  if (bb.x2 == null) {
    bb.x2 = bb.x1 + bb.w;
  }
  if (bb.w == null) {
    bb.w = bb.x2 - bb.x1;
  }
  if (bb.y2 == null) {
    bb.y2 = bb.y1 + bb.h;
  }
  if (bb.h == null) {
    bb.h = bb.y2 - bb.y1;
  }

  return bb;
};

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var assign = __webpack_require__(0);

var setInitialPositionState = function setInitialPositionState(node, state) {
  var p = node.position();
  var bb = state.currentBoundingBox;
  var scratch = node.scratch(state.name);

  if (scratch == null) {
    scratch = {};

    node.scratch(state.name, scratch);
  }

  assign(scratch, state.randomize ? {
    x: bb.x1 + Math.random() * bb.w,
    y: bb.y1 + Math.random() * bb.h
  } : {
    x: p.x,
    y: p.y
  });

  scratch.locked = node.locked();
};

var getNodePositionData = function getNodePositionData(node, state) {
  return node.scratch(state.name);
};

var refreshPositions = function refreshPositions(nodes, state) {
  nodes.positions(function (node) {
    var scratch = node.scratch(state.name);

    return {
      x: scratch.x,
      y: scratch.y
    };
  });
};

module.exports = { setInitialPositionState: setInitialPositionState, getNodePositionData: getNodePositionData, refreshPositions: refreshPositions };

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var nop = function nop() {};

var tick = function tick(state) {
  var s = state;
  var l = state.layout;

  var tickIndicatesDone = l.tick(s);

  if (s.firstUpdate) {
    if (s.animateContinuously) {
      // indicate the initial positions have been set
      s.layout.emit('layoutready');
    }
    s.firstUpdate = false;
  }

  s.tickIndex++;

  var duration = Date.now() - s.startTime;

  return !s.infinite && (tickIndicatesDone || s.tickIndex >= s.maxIterations || duration >= s.maxSimulationTime);
};

var multitick = function multitick(state) {
  var onNotDone = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : nop;
  var onDone = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : nop;

  var done = false;
  var s = state;

  for (var i = 0; i < s.refresh; i++) {
    done = !s.running || tick(s);

    if (done) {
      break;
    }
  }

  if (!done) {
    onNotDone();
  } else {
    onDone();
  }
};

module.exports = { tick: tick, multitick: multitick };

/***/ })
/******/ ]);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCA2MGFhNzhlOTI4NDc1MThmZDBmMyIsIndlYnBhY2s6Ly8vLi9zcmMvYXNzaWduLmpzIiwid2VicGFjazovLy8uL3NyYy9ldWxlci9zcHJpbmcuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2V1bGVyL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9ldWxlci9ib2R5LmpzIiwid2VicGFjazovLy8uL3NyYy9ldWxlci9kZWZhdWx0cy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvZXVsZXIvZHJhZy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvZXVsZXIvaW50ZWdyYXRlLmpzIiwid2VicGFjazovLy8uL3NyYy9ldWxlci9xdWFkdHJlZS9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvZXVsZXIvcXVhZHRyZWUvaW5zZXJ0U3RhY2suanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2V1bGVyL3F1YWR0cmVlL25vZGUuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2V1bGVyL3RpY2suanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9sYXlvdXQvZGVmYXVsdHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xheW91dC9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvbGF5b3V0L21ha2UtYmIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xheW91dC9wb3NpdGlvbi5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvbGF5b3V0L3RpY2suanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsIk9iamVjdCIsImFzc2lnbiIsImJpbmQiLCJ0Z3QiLCJzcmNzIiwiZm9yRWFjaCIsImtleXMiLCJzcmMiLCJrIiwicmVxdWlyZSIsImRlZmF1bHRzIiwiZnJlZXplIiwic291cmNlIiwidGFyZ2V0IiwibGVuZ3RoIiwiY29lZmYiLCJ3ZWlnaHQiLCJtYWtlU3ByaW5nIiwic3ByaW5nIiwiYXBwbHlTcHJpbmciLCJib2R5MSIsImJvZHkyIiwiZHgiLCJwb3MiLCJ4IiwiZHkiLCJ5IiwiciIsIk1hdGgiLCJzcXJ0IiwicmFuZG9tIiwiZCIsInNwcmluZ0NvZWZmIiwiZm9yY2UiLCJMYXlvdXQiLCJ0aWNrIiwibWFrZVF1YWR0cmVlIiwibWFrZUJvZHkiLCJpc0ZuIiwiZm4iLCJpc1BhcmVudCIsIm4iLCJub3RJc1BhcmVudCIsImlzTG9ja2VkIiwibG9ja2VkIiwibm90SXNMb2NrZWQiLCJpc1BhcmVudEVkZ2UiLCJlIiwibm90SXNQYXJlbnRFZGdlIiwiZ2V0Qm9keSIsInNjcmF0Y2giLCJib2R5IiwiZ2V0Tm9uUGFyZW50RGVzY2VuZGFudHMiLCJkZXNjZW5kYW50cyIsImZpbHRlciIsImdldFNjcmF0Y2giLCJlbCIsIm9wdEZuIiwib3B0IiwiZWxlIiwiRXVsZXIiLCJvcHRpb25zIiwic3RhdGUiLCJzIiwicXVhZHRyZWUiLCJib2RpZXMiLCJub2RlcyIsIm1hc3MiLCJfY3lOb2RlIiwiX3NjcmF0Y2giLCJwdXNoIiwic3ByaW5ncyIsImVkZ2VzIiwic3ByaW5nTGVuZ3RoIiwiX2N5RWRnZSIsInNvdXJjZXMiLCJ0YXJnZXRzIiwibW92ZW1lbnQiLCJpc0RvbmUiLCJtb3ZlbWVudFRocmVzaG9sZCIsInByZXZQb3MiLCJ2ZWxvY2l0eSIsImNvcHlWZWMiLCJ2IiwiZ2V0VmFsdWUiLCJ2YWwiLCJkZWYiLCJnZXRWZWMiLCJ2ZWMiLCJvcHRzIiwiYiIsImdyYXZpdHkiLCJwdWxsIiwidGhldGEiLCJkcmFnQ29lZmYiLCJ0aW1lU3RlcCIsImRlZmF1bHRDb2VmZiIsImFwcGx5RHJhZyIsIm1hbnVhbERyYWdDb2VmZiIsImludGVncmF0ZSIsInR4IiwidHkiLCJpIiwibWF4IiwiZ3JhYmJlZCIsInZ4IiwidnkiLCJhYnMiLCJOb2RlIiwiSW5zZXJ0U3RhY2siLCJyZXNldFZlYyIsImlzU2FtZVBvc2l0aW9uIiwicDEiLCJwMiIsInRocmVzaG9sZCIsInVwZGF0ZVF1ZXVlIiwiaW5zZXJ0U3RhY2siLCJub2Rlc0NhY2hlIiwiY3VycmVudEluQ2FjaGUiLCJyb290IiwibmV3Tm9kZSIsIm5vZGUiLCJxdWFkMCIsInF1YWQxIiwicXVhZDIiLCJxdWFkMyIsIm1hc3NYIiwibWFzc1kiLCJsZWZ0IiwicmlnaHQiLCJ0b3AiLCJib3R0b20iLCJ1cGRhdGUiLCJzb3VyY2VCb2R5IiwicXVldWUiLCJmeCIsImZ5IiwicXVldWVMZW5ndGgiLCJzaGlmdElkeCIsInB1c2hJZHgiLCJweCIsInB5IiwicHIiLCJwdiIsImRpZmZlcmVudEJvZHkiLCJpbnNlcnRCb2RpZXMiLCJ4MSIsIk51bWJlciIsIk1BWF9WQUxVRSIsInkxIiwieDIiLCJNSU5fVkFMVUUiLCJ5MiIsImluc2VydCIsIm5ld0JvZHkiLCJyZXNldCIsImlzRW1wdHkiLCJzdGFja0l0ZW0iLCJwb3AiLCJxdWFkSWR4IiwiY2hpbGQiLCJnZXRDaGlsZCIsInNldENoaWxkIiwib2xkQm9keSIsInJldHJpZXNDb3VudCIsIm9mZnNldCIsInVwZGF0ZUJvZHlGb3JjZSIsImlkeCIsInN0YWNrIiwicG9wSWR4IiwicHJvdG90eXBlIiwiaXRlbSIsIkluc2VydFN0YWNrRWxlbWVudCIsInAiLCJyZWdpc3RlciIsImN5dG9zY2FwZSIsImFuaW1hdGUiLCJyZWZyZXNoIiwibWF4SXRlcmF0aW9ucyIsIm1heFNpbXVsYXRpb25UaW1lIiwidW5ncmFiaWZ5V2hpbGVTaW11bGF0aW5nIiwiZml0IiwicGFkZGluZyIsImJvdW5kaW5nQm94IiwidW5kZWZpbmVkIiwicmVhZHkiLCJzdG9wIiwicmFuZG9taXplIiwiaW5maW5pdGUiLCJtYWtlQm91bmRpbmdCb3giLCJzZXRJbml0aWFsUG9zaXRpb25TdGF0ZSIsInJlZnJlc2hQb3NpdGlvbnMiLCJnZXROb2RlUG9zaXRpb25EYXRhIiwibXVsdGl0aWNrIiwibyIsImxheW91dCIsImVsZXMiLCJ0aWNrSW5kZXgiLCJmaXJzdFVwZGF0ZSIsImFuaW1hdGVFbmQiLCJhbmltYXRlQ29udGludW91c2x5IiwibCIsInN0YXJ0VGltZSIsIkRhdGUiLCJub3ciLCJydW5uaW5nIiwiY3VycmVudEJvdW5kaW5nQm94IiwiY3kiLCJvbmUiLCJwcmVydW4iLCJ1bmdyYWJpZnkiLCJncmFiYmFibGUiLCJyZWdyYWJpZnkiLCJncmFiaWZ5IiwidXBkYXRlR3JhYlN0YXRlIiwib25HcmFiIiwib25GcmVlIiwib25EcmFnIiwidHAiLCJwb3NpdGlvbiIsImxpc3RlblRvR3JhYiIsIm9uIiwidW5saXN0ZW5Ub0dyYWIiLCJyZW1vdmVMaXN0ZW5lciIsIm9uTm90RG9uZSIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsImZyYW1lIiwib25Eb25lIiwiZW1pdCIsImRvbmUiLCJsYXlvdXRQb3NpdGlvbnMiLCJwZCIsInBvc3RydW4iLCJiYiIsInciLCJ3aWR0aCIsImgiLCJoZWlnaHQiLCJuYW1lIiwicG9zaXRpb25zIiwibm9wIiwidGlja0luZGljYXRlc0RvbmUiLCJkdXJhdGlvbiJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87UUNWQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTs7O1FBR0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0EsMkNBQTJDLGNBQWM7O1FBRXpEO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0EsS0FBSztRQUNMO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMkJBQTJCLDBCQUEwQixFQUFFO1FBQ3ZELGlDQUFpQyxlQUFlO1FBQ2hEO1FBQ0E7UUFDQTs7UUFFQTtRQUNBLHNEQUFzRCwrREFBK0Q7O1FBRXJIO1FBQ0E7O1FBRUE7UUFDQTs7Ozs7Ozs7OztBQ2hFQUEsT0FBT0MsT0FBUCxHQUFpQkMsT0FBT0Ms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QSxNQUEvQmtLLFNBQStCLHVFQUFuQmdCLEdBQW1CO0FBQUEsTUFBZGIsTUFBYyx1RUFBTGEsR0FBSzs7QUFDOUQsTUFBSVgsT0FBTyxLQUFYO0FBQ0EsTUFBSXRLLElBQUlELEtBQVI7O0FBRUEsT0FBSyxJQUFJd0MsSUFBSSxDQUFiLEVBQWdCQSxJQUFJdkMsRUFBRWtILE9BQXRCLEVBQStCM0UsR0FBL0IsRUFBb0M7QUFDbEMrSCxXQUFPLENBQUN0SyxFQUFFOEksT0FBSCxJQUFjMUssS0FBTTRCLENBQU4sQ0FBckI7O0FBRUEsUUFBSXNLLElBQUosRUFBVTtBQUFFO0FBQVE7QUFDckI7O0FBRUQsTUFBSSxDQUFDQSxJQUFMLEVBQVc7QUFDVEw7QUFDRCxHQUZELE1BRU87QUFDTEc7QUFDRDtBQUNGLENBZkQ7O0FBaUJBck8sT0FBT0MsT0FBUCxHQUFpQixFQUFFb0MsVUFBRixFQUFROEosb0JBQVIsRUFBakIsQyIsImZpbGUiOiJjeXRvc2NhcGUtZXVsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJjeXRvc2NhcGVFdWxlclwiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJjeXRvc2NhcGVFdWxlclwiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKCkge1xucmV0dXJuIFxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyB3ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24iLCIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBpZGVudGl0eSBmdW5jdGlvbiBmb3IgY2FsbGluZyBoYXJtb255IGltcG9ydHMgd2l0aCB0aGUgY29ycmVjdCBjb250ZXh0XG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmkgPSBmdW5jdGlvbih2YWx1ZSkgeyByZXR1cm4gdmFsdWU7IH07XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwge1xuIFx0XHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcbiBcdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG4gXHRcdFx0XHRnZXQ6IGdldHRlclxuIFx0XHRcdH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IDExKTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyB3ZWJwYWNrL2Jvb3RzdHJhcCA2MGFhNzhlOTI4NDc1MThmZDBmMyIsIm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmFzc2lnbiAhPSBudWxsID8gT2JqZWN0LmFzc2lnbi5iaW5kKCBPYmplY3QgKSA6IGZ1bmN0aW9uKCB0Z3QsIC4uLnNyY3MgKXtcbiAgc3Jjcy5mb3JFYWNoKCBzcmMgPT4ge1xuICAgIE9iamVjdC5rZXlzKCBzcmMgKS5mb3JFYWNoKCBrID0+IHRndFtrXSA9IHNyY1trXSApO1xuICB9ICk7XG5cbiAgcmV0dXJuIHRndDtcbn07XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvYXNzaWduLmpzIiwiY29uc3QgYXNzaWduID0gcmVxdWlyZSgnLi4vYXNzaWduJyk7XG5cbmNvbnN0IGRlZmF1bHRzID0gT2JqZWN0LmZyZWV6ZSh7XG4gIHNvdXJjZTogbnVsbCxcbiAgdGFyZ2V0OiBudWxsLFxuICBsZW5ndGg6IDgwLFxuICBjb2VmZjogMC4wMDAyLFxuICB3ZWlnaHQ6IDFcbn0pO1xuXG5mdW5jdGlvbiBtYWtlU3ByaW5nKCBzcHJpbmcgKXtcbiAgcmV0dXJuIGFzc2lnbigge30sIGRlZmF1bHRzLCBzcHJpbmcgKTtcbn1cblxuZnVuY3Rpb24gYXBwbHlTcHJpbmcoIHNwcmluZyApe1xuICBsZXQgYm9keTEgPSBzcHJpbmcuc291cmNlLFxuICAgICAgYm9keTIgPSBzcHJpbmcudGFyZ2V0LFxuICAgICAgbGVuZ3RoID0gc3ByaW5nLmxlbmd0aCA8IDAgPyBkZWZhdWx0cy5sZW5ndGggOiBzcHJpbmcubGVuZ3RoLFxuICAgICAgZHggPSBib2R5Mi5wb3MueCAtIGJvZHkxLnBvcy54LFxuICAgICAgZHkgPSBib2R5Mi5wb3MueSAtIGJvZHkxLnBvcy55LFxuICAgICAgciA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG5cbiAgaWYgKHIgPT09IDApIHtcbiAgICAgIGR4ID0gKE1hdGgucmFuZG9tKCkgLSAwLjUpIC8gNTA7XG4gICAgICBkeSA9IChNYXRoLnJhbmRvbSgpIC0gMC41KSAvIDUwO1xuICAgICAgciA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG4gIH1cblxuICBsZXQgZCA9IHIgLSBsZW5ndGg7XG4gIGxldCBjb2VmZiA9ICgoIXNwcmluZy5jb2VmZiB8fCBzcHJpbmcuY29lZmYgPCAwKSA/IGRlZmF1bHRzLnNwcmluZ0NvZWZmIDogc3ByaW5nLmNvZWZmKSAqIGQgLyByICogc3ByaW5nLndlaWdodDtcblxuICBib2R5MS5mb3JjZS54ICs9IGNvZWZmICogZHg7XG4gIGJvZHkxLmZvcmNlLnkgKz0gY29lZmYgKiBkeTtcblxuICBib2R5Mi5mb3JjZS54IC09IGNvZWZmICogZHg7XG4gIGJvZHkyLmZvcmNlLnkgLT0gY29lZmYgKiBkeTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IG1ha2VTcHJpbmcsIGFwcGx5U3ByaW5nIH07XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvZXVsZXIvc3ByaW5nLmpzIiwiLyoqXG5UaGUgaW1wbGVtZW50YXRpb24gb2YgdGhlIEV1bGVyIGxheW91dCBhbGdvcml0aG1cbiovXG5cbmNvbnN0IExheW91dCA9IHJlcXVpcmUoJy4uL2xheW91dCcpO1xuY29uc3QgYXNzaWduID0gcmVxdWlyZSgnLi4vYXNzaWduJyk7XG5jb25zdCBkZWZhdWx0cyA9IHJlcXVpcmUoJy4vZGVmYXVsdHMnKTtcbmNvbnN0IHsgdGljayB9ID0gcmVxdWlyZSgnLi90aWNrJyk7XG5jb25zdCB7IG1ha2VRdWFkdHJlZSB9ID0gcmVxdWlyZSgnLi9xdWFkdHJlZScpO1xuY29uc3QgeyBtYWtlQm9keSB9ID0gcmVxdWlyZSgnLi9ib2R5Jyk7XG5jb25zdCB7IG1ha2VTcHJpbmcgfSA9IHJlcXVpcmUoJy4vc3ByaW5nJyk7XG5jb25zdCBpc0ZuID0gZm4gPT4gdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nO1xuY29uc3QgaXNQYXJlbnQgPSBuID0+IG4uaXNQYXJlbnQoKTtcbmNvbnN0IG5vdElzUGFyZW50ID0gbiA9PiAhaXNQYXJlbnQobik7XG5jb25zdCBpc0xvY2tlZCA9IG4gPT4gbi5sb2NrZWQoKTtcbmNvbnN0IG5vdElzTG9ja2VkID0gbiA9PiAhaXNMb2NrZWQobik7XG5jb25zdCBpc1BhcmVudEVkZ2UgPSBlID0+IGlzUGFyZW50KCBlLnNvdXJjZSgpICkgfHwgaXNQYXJlbnQoIGUudGFyZ2V0KCkgKTtcbmNvbnN0IG5vdElzUGFyZW50RWRnZSA9IGUgPT4gIWlzUGFyZW50RWRnZShlKTtcbmNvbnN0IGdldEJvZHkgPSBuID0+IG4uc2NyYXRjaCgnZXVsZXInKS5ib2R5O1xuY29uc3QgZ2V0Tm9uUGFyZW50RGVzY2VuZGFudHMgPSBuID0+IGlzUGFyZW50KG4pID8gbi5kZXNjZW5kYW50cygpLmZpbHRlciggbm90SXNQYXJlbnQgKSA6IG47XG5cbmNvbnN0IGdldFNjcmF0Y2ggPSBlbCA9PiB7XG4gIGxldCBzY3JhdGNoID0gZWwuc2NyYXRjaCgnZXVsZXInKTtcblxuICBpZiggIXNjcmF0Y2ggKXtcbiAgICBzY3JhdGNoID0ge307XG5cbiAgICBlbC5zY3JhdGNoKCdldWxlcicsIHNjcmF0Y2gpO1xuICB9XG5cbiAgcmV0dXJuIHNjcmF0Y2g7XG59O1xuXG5jb25zdCBvcHRGbiA9ICggb3B0LCBlbGUgKSA9PiB7XG4gIGlmKCBpc0ZuKCBvcHQgKSApe1xuICAgIHJldHVybiBvcHQoIGVsZSApO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBvcHQ7XG4gIH1cbn07XG5cbmNsYXNzIEV1bGVyIGV4dGVuZHMgTGF5b3V0IHtcbiAgY29uc3RydWN0b3IoIG9wdGlvbnMgKXtcbiAgICBzdXBlciggYXNzaWduKCB7fSwgZGVmYXVsdHMsIG9wdGlvbnMgKSApO1xuICB9XG5cbiAgcHJlcnVuKCBzdGF0ZSApe1xuICAgIGxldCBzID0gc3RhdGU7XG5cbiAgICBzLnF1YWR0cmVlID0gbWFrZVF1YWR0cmVlKCk7XG5cbiAgICBsZXQgYm9kaWVzID0gcy5ib2RpZXMgPSBbXTtcblxuICAgIC8vIHJlZ3VsYXIgbm9kZXNcbiAgICBzLm5vZGVzLmZpbHRlciggbiA9PiBub3RJc1BhcmVudChuKSApLmZvckVhY2goIG4gPT4ge1xuICAgICAgbGV0IHNjcmF0Y2ggPSBnZXRTY3JhdGNoKCBuICk7XG5cbiAgICAgIGxldCBib2R5ID0gbWFrZUJvZHkoe1xuICAgICAgICBwb3M6IHsgeDogc2NyYXRjaC54LCB5OiBzY3JhdGNoLnkgfSxcbiAgICAgICAgbWFzczogb3B0Rm4oIHMubWFzcywgbiApLFxuICAgICAgICBsb2NrZWQ6IHNjcmF0Y2gubG9ja2VkXG4gICAgICB9KTtcblxuICAgICAgYm9keS5fY3lOb2RlID0gbjtcblxuICAgICAgc2NyYXRjaC5ib2R5ID0gYm9keTtcblxuICAgICAgYm9keS5fc2NyYXRjaCA9IHNjcmF0Y2g7XG5cbiAgICAgIGJvZGllcy5wdXNoKCBib2R5ICk7XG4gICAgfSApO1xuXG4gICAgbGV0IHNwcmluZ3MgPSBzLnNwcmluZ3MgPSBbXTtcblxuICAgIC8vIHJlZ3VsYXIgZWRnZSBzcHJpbmdzXG4gICAgcy5lZGdlcy5maWx0ZXIoIG5vdElzUGFyZW50RWRnZSApLmZvckVhY2goIGUgPT4ge1xuICAgICAgbGV0IHNwcmluZyA9IG1ha2VTcHJpbmcoe1xuICAgICAgICBzb3VyY2U6IGdldEJvZHkoIGUuc291cmNlKCkgKSxcbiAgICAgICAgdGFyZ2V0OiBnZXRCb2R5KCBlLnRhcmdldCgpICksXG4gICAgICAgIGxlbmd0aDogb3B0Rm4oIHMuc3ByaW5nTGVuZ3RoLCBlICksXG4gICAgICAgIGNvZWZmOiBvcHRGbiggcy5zcHJpbmdDb2VmZiwgZSApXG4gICAgICB9KTtcblxuICAgICAgc3ByaW5nLl9jeUVkZ2UgPSBlO1xuXG4gICAgICBsZXQgc2NyYXRjaCA9IGdldFNjcmF0Y2goIGUgKTtcblxuICAgICAgc3ByaW5nLl9zY3JhdGNoID0gc2NyYXRjaDtcblxuICAgICAgc2NyYXRjaC5zcHJpbmcgPSBzcHJpbmc7XG5cbiAgICAgIHNwcmluZ3MucHVzaCggc3ByaW5nICk7XG4gICAgfSApO1xuXG4gICAgLy8gY29tcG91bmQgZWRnZSBzcHJpbmdzXG4gICAgcy5lZGdlcy5maWx0ZXIoIGlzUGFyZW50RWRnZSApLmZvckVhY2goIGUgPT4ge1xuICAgICAgbGV0IHNvdXJjZXMgPSBnZXROb25QYXJlbnREZXNjZW5kYW50cyggZS5zb3VyY2UoKSApO1xuICAgICAgbGV0IHRhcmdldHMgPSBnZXROb25QYXJlbnREZXNjZW5kYW50cyggZS50YXJnZXQoKSApO1xuXG4gICAgICAvLyBqdXN0IGFkZCBvbmUgc3ByaW5nIGZvciBwZXJmXG4gICAgICBzb3VyY2VzID0gWyBzb3VyY2VzWzBdIF07XG4gICAgICB0YXJnZXRzID0gWyB0YXJnZXRzWzBdIF07XG5cbiAgICAgIHNvdXJjZXMuZm9yRWFjaCggc3JjID0+IHtcbiAgICAgICAgdGFyZ2V0cy5mb3JFYWNoKCB0Z3QgPT4ge1xuICAgICAgICAgIHNwcmluZ3MucHVzaCggbWFrZVNwcmluZyh7XG4gICAgICAgICAgICBzb3VyY2U6IGdldEJvZHkoIHNyYyApLFxuICAgICAgICAgICAgdGFyZ2V0OiBnZXRCb2R5KCB0Z3QgKSxcbiAgICAgICAgICAgIGxlbmd0aDogb3B0Rm4oIHMuc3ByaW5nTGVuZ3RoLCBlICksXG4gICAgICAgICAgICBjb2VmZjogb3B0Rm4oIHMuc3ByaW5nQ29lZmYsIGUgKVxuICAgICAgICAgIH0pICk7XG4gICAgICAgIH0gKTtcbiAgICAgIH0gKTtcbiAgICB9ICk7XG4gIH1cblxuICB0aWNrKCBzdGF0ZSApe1xuICAgIGxldCBtb3ZlbWVudCA9IHRpY2soIHN0YXRlICk7XG5cbiAgICBsZXQgaXNEb25lID0gbW92ZW1lbnQgPD0gc3RhdGUubW92ZW1lbnRUaHJlc2hvbGQ7XG5cbiAgICByZXR1cm4gaXNEb25lO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRXVsZXI7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvZXVsZXIvaW5kZXguanMiLCJjb25zdCBkZWZhdWx0cyA9IE9iamVjdC5mcmVlemUoe1xuICBwb3M6IHsgeDogMCwgeTogMCB9LFxuICBwcmV2UG9zOiB7IHg6IDAsIHk6IDAgfSxcbiAgZm9yY2U6IHsgeDogMCwgeTogMCB9LFxuICB2ZWxvY2l0eTogeyB4OiAwLCB5OiAwIH0sXG4gIG1hc3M6IDFcbn0pO1xuXG5jb25zdCBjb3B5VmVjID0gdiA9PiAoeyB4OiB2LngsIHk6IHYueSB9KTtcbmNvbnN0IGdldFZhbHVlID0gKCB2YWwsIGRlZiApID0+IHZhbCAhPSBudWxsID8gdmFsIDogZGVmO1xuY29uc3QgZ2V0VmVjID0gKCB2ZWMsIGRlZiApID0+IGNvcHlWZWMoIGdldFZhbHVlKCB2ZWMsIGRlZiApICk7XG5cbmZ1bmN0aW9uIG1ha2VCb2R5KCBvcHRzICl7XG4gIGxldCBiID0ge307XG5cbiAgYi5wb3MgPSBnZXRWZWMoIG9wdHMucG9zLCBkZWZhdWx0cy5wb3MgKTtcbiAgYi5wcmV2UG9zID0gZ2V0VmVjKCBvcHRzLnByZXZQb3MsIGIucG9zICk7XG4gIGIuZm9yY2UgPSBnZXRWZWMoIG9wdHMuZm9yY2UsIGRlZmF1bHRzLmZvcmNlICk7XG4gIGIudmVsb2NpdHkgPSBnZXRWZWMoIG9wdHMudmVsb2NpdHksIGRlZmF1bHRzLnZlbG9jaXR5ICk7XG4gIGIubWFzcyA9IG9wdHMubWFzcyAhPSBudWxsID8gb3B0cy5tYXNzIDogZGVmYXVsdHMubWFzcztcbiAgYi5sb2NrZWQgPSBvcHRzLmxvY2tlZDtcblxuICByZXR1cm4gYjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IG1ha2VCb2R5IH07XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvZXVsZXIvYm9keS5qcyIsImNvbnN0IGRlZmF1bHRzID0gT2JqZWN0LmZyZWV6ZSh7XG4gIC8vIFRoZSBpZGVhbCBsZWd0aCBvZiBhIHNwcmluZ1xuICAvLyAtIFRoaXMgYWN0cyBhcyBhIGhpbnQgZm9yIHRoZSBlZGdlIGxlbmd0aFxuICAvLyAtIFRoZSBlZGdlIGxlbmd0aCBjYW4gYmUgbG9uZ2VyIG9yIHNob3J0ZXIgaWYgdGhlIGZvcmNlcyBhcmUgc2V0IHRvIGV4dHJlbWUgdmFsdWVzXG4gIHNwcmluZ0xlbmd0aDogZWRnZSA9PiA4MCxcblxuICAvLyBIb29rZSdzIGxhdyBjb2VmZmljaWVudFxuICAvLyAtIFRoZSB2YWx1ZSByYW5nZXMgb24gWzAsIDFdXG4gIC8vIC0gTG93ZXIgdmFsdWVzIGdpdmUgbG9vc2VyIHNwcmluZ3NcbiAgLy8gLSBIaWdoZXIgdmFsdWVzIGdpdmUgdGlnaHRlciBzcHJpbmdzXG4gIHNwcmluZ0NvZWZmOiBlZGdlID0+IDAuMDAwOCxcblxuICAvLyBUaGUgbWFzcyBvZiB0aGUgbm9kZSBpbiB0aGUgcGh5c2ljcyBzaW11bGF0aW9uXG4gIC8vIC0gVGhlIG1hc3MgYWZmZWN0cyB0aGUgZ3Jhdml0eSBub2RlIHJlcHVsc2lvbi9hdHRyYWN0aW9uXG4gIG1hc3M6IG5vZGUgPT4gNCxcblxuICAvLyBDb3Vsb21iJ3MgbGF3IGNvZWZmaWNpZW50XG4gIC8vIC0gTWFrZXMgdGhlIG5vZGVzIHJlcGVsIGVhY2ggb3RoZXIgZm9yIG5lZ2F0aXZlIHZhbHVlc1xuICAvLyAtIE1ha2VzIHRoZSBub2RlcyBhdHRyYWN0IGVhY2ggb3RoZXIgZm9yIHBvc2l0aXZlIHZhbHVlc1xuICBncmF2aXR5OiAtMS4yLFxuXG4gIC8vIEEgZm9yY2UgdGhhdCBwdWxscyBub2RlcyB0b3dhcmRzIHRoZSBvcmlnaW4gKDAsIDApXG4gIC8vIEhpZ2hlciB2YWx1ZXMga2VlcCB0aGUgY29tcG9uZW50cyBsZXNzIHNwcmVhZCBvdXRcbiAgcHVsbDogMC4wMDEsXG5cbiAgLy8gVGhldGEgY29lZmZpY2llbnQgZnJvbSBCYXJuZXMtSHV0IHNpbXVsYXRpb25cbiAgLy8gLSBWYWx1ZSByYW5nZXMgb24gWzAsIDFdXG4gIC8vIC0gUGVyZm9ybWFuY2UgaXMgYmV0dGVyIHdpdGggc21hbGxlciB2YWx1ZXNcbiAgLy8gLSBWZXJ5IHNtYWxsIHZhbHVlcyBtYXkgbm90IGNyZWF0ZSBlbm91Z2ggZm9yY2UgdG8gZ2l2ZSBhIGdvb2QgcmVzdWx0XG4gIHRoZXRhOiAwLjY2NixcblxuICAvLyBGcmljdGlvbiAvIGRyYWcgY29lZmZpY2llbnQgdG8gbWFrZSB0aGUgc3lzdGVtIHN0YWJpbGlzZSBvdmVyIHRpbWVcbiAgZHJhZ0NvZWZmOiAwLjAyLFxuXG4gIC8vIFdoZW4gdGhlIHRvdGFsIG9mIHRoZSBzcXVhcmVkIHBvc2l0aW9uIGRlbHRhcyBpcyBsZXNzIHRoYW4gdGhpcyB2YWx1ZSwgdGhlIHNpbXVsYXRpb24gZW5kc1xuICBtb3ZlbWVudFRocmVzaG9sZDogMSxcblxuICAvLyBUaGUgYW1vdW50IG9mIHRpbWUgcGFzc2VkIHBlciB0aWNrXG4gIC8vIC0gTGFyZ2VyIHZhbHVlcyByZXN1bHQgaW4gZmFzdGVyIHJ1bnRpbWVzIGJ1dCBtaWdodCBzcHJlYWQgdGhpbmdzIG91dCB0b28gZmFyXG4gIC8vIC0gU21hbGxlciB2YWx1ZXMgcHJvZHVjZSBtb3JlIGFjY3VyYXRlIHJlc3VsdHNcbiAgdGltZVN0ZXA6IDIwXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBkZWZhdWx0cztcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9ldWxlci9kZWZhdWx0cy5qcyIsImNvbnN0IGRlZmF1bHRDb2VmZiA9IDAuMDI7XG5cbmZ1bmN0aW9uIGFwcGx5RHJhZyggYm9keSwgbWFudWFsRHJhZ0NvZWZmICl7XG4gIGxldCBkcmFnQ29lZmY7XG5cbiAgaWYoIG1hbnVhbERyYWdDb2VmZiAhPSBudWxsICl7XG4gICAgZHJhZ0NvZWZmID0gbWFudWFsRHJhZ0NvZWZmO1xuICB9IGVsc2UgaWYoIGJvZHkuZHJhZ0NvZWZmICE9IG51bGwgKXtcbiAgICBkcmFnQ29lZmYgPSBib2R5LmRyYWdDb2VmZjtcbiAgfSBlbHNlIHtcbiAgICBkcmFnQ29lZmYgPSBkZWZhdWx0Q29lZmY7XG4gIH1cblxuICBib2R5LmZvcmNlLnggLT0gZHJhZ0NvZWZmICogYm9keS52ZWxvY2l0eS54O1xuICBib2R5LmZvcmNlLnkgLT0gZHJhZ0NvZWZmICogYm9keS52ZWxvY2l0eS55O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgYXBwbHlEcmFnIH07XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvZXVsZXIvZHJhZy5qcyIsIi8vIHVzZSBldWxlciBtZXRob2QgZm9yIGZvcmNlIGludGVncmF0aW9uIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRXVsZXJfbWV0aG9kXG4vLyByZXR1cm4gc3VtIG9mIHNxdWFyZWQgcG9zaXRpb24gZGVsdGFzXG5mdW5jdGlvbiBpbnRlZ3JhdGUoIGJvZGllcywgdGltZVN0ZXAgKXtcbiAgdmFyIGR4ID0gMCwgdHggPSAwLFxuICAgICAgZHkgPSAwLCB0eSA9IDAsXG4gICAgICBpLFxuICAgICAgbWF4ID0gYm9kaWVzLmxlbmd0aDtcblxuICBpZiAobWF4ID09PSAwKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBmb3IgKGkgPSAwOyBpIDwgbWF4OyArK2kpIHtcbiAgICB2YXIgYm9keSA9IGJvZGllc1tpXSxcbiAgICAgICAgY29lZmYgPSB0aW1lU3RlcCAvIGJvZHkubWFzcztcblxuICAgIGlmKCBib2R5LmdyYWJiZWQgKXsgY29udGludWU7IH1cblxuICAgIGlmKCBib2R5LmxvY2tlZCApe1xuICAgICAgYm9keS52ZWxvY2l0eS54ID0gMDtcbiAgICAgIGJvZHkudmVsb2NpdHkueSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJvZHkudmVsb2NpdHkueCArPSBjb2VmZiAqIGJvZHkuZm9yY2UueDtcbiAgICAgIGJvZHkudmVsb2NpdHkueSArPSBjb2VmZiAqIGJvZHkuZm9yY2UueTtcbiAgICB9XG5cbiAgICB2YXIgdnggPSBib2R5LnZlbG9jaXR5LngsXG4gICAgICAgIHZ5ID0gYm9keS52ZWxvY2l0eS55LFxuICAgICAgICB2ID0gTWF0aC5zcXJ0KHZ4ICogdnggKyB2eSAqIHZ5KTtcblxuICAgIGlmICh2ID4gMSkge1xuICAgICAgYm9keS52ZWxvY2l0eS54ID0gdnggLyB2O1xuICAgICAgYm9keS52ZWxvY2l0eS55ID0gdnkgLyB2O1xuICAgIH1cblxuICAgIGR4ID0gdGltZVN0ZXAgKiBib2R5LnZlbG9jaXR5Lng7XG4gICAgZHkgPSB0aW1lU3RlcCAqIGJvZHkudmVsb2NpdHkueTtcblxuICAgIGJvZHkucG9zLnggKz0gZHg7XG4gICAgYm9keS5wb3MueSArPSBkeTtcblxuICAgIHR4ICs9IE1hdGguYWJzKGR4KTsgdHkgKz0gTWF0aC5hYnMoZHkpO1xuICB9XG5cbiAgcmV0dXJuICh0eCAqIHR4ICsgdHkgKiB0eSkvbWF4O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgaW50ZWdyYXRlIH07XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvZXVsZXIvaW50ZWdyYXRlLmpzIiwiLy8gaW1wbCBvZiBiYXJuZXMgaHV0XG4vLyBodHRwOi8vd3d3LmVlY3MuYmVya2VsZXkuZWR1L35kZW1tZWwvY3MyNjcvbGVjdHVyZTI2L2xlY3R1cmUyNi5odG1sXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jhcm5lcyVFMiU4MCU5M0h1dF9zaW11bGF0aW9uXG5cbmNvbnN0IE5vZGUgPSByZXF1aXJlKCcuL25vZGUnKTtcbmNvbnN0IEluc2VydFN0YWNrID0gcmVxdWlyZSgnLi9pbnNlcnRTdGFjaycpO1xuXG5jb25zdCByZXNldFZlYyA9IHYgPT4geyB2LnggPSAwOyB2LnkgPSAwOyB9O1xuXG5jb25zdCBpc1NhbWVQb3NpdGlvbiA9IChwMSwgcDIpID0+IHtcbiAgbGV0IHRocmVzaG9sZCA9IDFlLTg7XG4gIGxldCBkeCA9IE1hdGguYWJzKHAxLnggLSBwMi54KTtcbiAgbGV0IGR5ID0gTWF0aC5hYnMocDEueSAtIHAyLnkpO1xuXG4gIHJldHVybiBkeCA8IHRocmVzaG9sZCAmJiBkeSA8IHRocmVzaG9sZDtcbn07XG5cbmZ1bmN0aW9uIG1ha2VRdWFkdHJlZSgpe1xuICBsZXQgdXBkYXRlUXVldWUgPSBbXSxcbiAgICBpbnNlcnRTdGFjayA9IG5ldyBJbnNlcnRTdGFjaygpLFxuICAgIG5vZGVzQ2FjaGUgPSBbXSxcbiAgICBjdXJyZW50SW5DYWNoZSA9IDAsXG4gICAgcm9vdCA9IG5ld05vZGUoKTtcblxuICBmdW5jdGlvbiBuZXdOb2RlKCkge1xuICAgIC8vIFRvIGF2b2lkIHByZXNzdXJlIG9uIEdDIHdlIHJldXNlIG5vZGVzLlxuICAgIGxldCBub2RlID0gbm9kZXNDYWNoZVtjdXJyZW50SW5DYWNoZV07XG4gICAgaWYgKG5vZGUpIHtcbiAgICAgIG5vZGUucXVhZDAgPSBudWxsO1xuICAgICAgbm9kZS5xdWFkMSA9IG51bGw7XG4gICAgICBub2RlLnF1YWQyID0gbnVsbDtcbiAgICAgIG5vZGUucXVhZDMgPSBudWxsO1xuICAgICAgbm9kZS5ib2R5ID0gbnVsbDtcbiAgICAgIG5vZGUubWFzcyA9IG5vZGUubWFzc1ggPSBub2RlLm1hc3NZID0gMDtcbiAgICAgIG5vZGUubGVmdCA9IG5vZGUucmlnaHQgPSBub2RlLnRvcCA9IG5vZGUuYm90dG9tID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZSA9IG5ldyBOb2RlKCk7XG4gICAgICBub2Rlc0NhY2hlW2N1cnJlbnRJbkNhY2hlXSA9IG5vZGU7XG4gICAgfVxuXG4gICAgKytjdXJyZW50SW5DYWNoZTtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZSggc291cmNlQm9keSwgZ3Jhdml0eSwgdGhldGEsIHB1bGwgKSB7XG4gICAgbGV0IHF1ZXVlID0gdXBkYXRlUXVldWUsXG4gICAgICB2LFxuICAgICAgZHgsXG4gICAgICBkeSxcbiAgICAgIHIsIGZ4ID0gMCxcbiAgICAgIGZ5ID0gMCxcbiAgICAgIHF1ZXVlTGVuZ3RoID0gMSxcbiAgICAgIHNoaWZ0SWR4ID0gMCxcbiAgICAgIHB1c2hJZHggPSAxO1xuXG4gICAgcXVldWVbMF0gPSByb290O1xuXG4gICAgcmVzZXRWZWMoIHNvdXJjZUJvZHkuZm9yY2UgKTtcblxuICAgIGxldCBweCA9IC1zb3VyY2VCb2R5LnBvcy54O1xuICAgIGxldCBweSA9IC1zb3VyY2VCb2R5LnBvcy55O1xuICAgIGxldCBwciA9IE1hdGguc3FydChweCAqIHB4ICsgcHkgKiBweSk7XG4gICAgbGV0IHB2ID0gc291cmNlQm9keS5tYXNzICogcHVsbCAvIHByO1xuXG4gICAgZnggKz0gcHYgKiBweDtcbiAgICBmeSArPSBwdiAqIHB5O1xuXG4gICAgd2hpbGUgKHF1ZXVlTGVuZ3RoKSB7XG4gICAgICBsZXQgbm9kZSA9IHF1ZXVlW3NoaWZ0SWR4XSxcbiAgICAgICAgYm9keSA9IG5vZGUuYm9keTtcblxuICAgICAgcXVldWVMZW5ndGggLT0gMTtcbiAgICAgIHNoaWZ0SWR4ICs9IDE7XG4gICAgICBsZXQgZGlmZmVyZW50Qm9keSA9IChib2R5ICE9PSBzb3VyY2VCb2R5KTtcbiAgICAgIGlmIChib2R5ICYmIGRpZmZlcmVudEJvZHkpIHtcbiAgICAgICAgLy8gSWYgdGhlIGN1cnJlbnQgbm9kZSBpcyBhIGxlYWYgbm9kZSAoYW5kIGl0IGlzIG5vdCBzb3VyY2UgYm9keSksXG4gICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgZm9yY2UgZXhlcnRlZCBieSB0aGUgY3VycmVudCBub2RlIG9uIGJvZHksIGFuZCBhZGQgdGhpc1xuICAgICAgICAvLyBhbW91bnQgdG8gYm9keSdzIG5ldCBmb3JjZS5cbiAgICAgICAgZHggPSBib2R5LnBvcy54IC0gc291cmNlQm9keS5wb3MueDtcbiAgICAgICAgZHkgPSBib2R5LnBvcy55IC0gc291cmNlQm9keS5wb3MueTtcbiAgICAgICAgciA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG5cbiAgICAgICAgaWYgKHIgPT09IDApIHtcbiAgICAgICAgICAvLyBQb29yIG1hbidzIHByb3RlY3Rpb24gYWdhaW5zdCB6ZXJvIGRpc3RhbmNlLlxuICAgICAgICAgIGR4ID0gKE1hdGgucmFuZG9tKCkgLSAwLjUpIC8gNTA7XG4gICAgICAgICAgZHkgPSAoTWF0aC5yYW5kb20oKSAtIDAuNSkgLyA1MDtcbiAgICAgICAgICByID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoaXMgaXMgc3RhbmRhcmQgZ3Jhdml0aW9uIGZvcmNlIGNhbGN1bGF0aW9uIGJ1dCB3ZSBkaXZpZGVcbiAgICAgICAgLy8gYnkgcl4zIHRvIHNhdmUgdHdvIG9wZXJhdGlvbnMgd2hlbiBub3JtYWxpemluZyBmb3JjZSB2ZWN0b3IuXG4gICAgICAgIHYgPSBncmF2aXR5ICogYm9keS5tYXNzICogc291cmNlQm9keS5tYXNzIC8gKHIgKiByICogcik7XG4gICAgICAgIGZ4ICs9IHYgKiBkeDtcbiAgICAgICAgZnkgKz0gdiAqIGR5O1xuICAgICAgfSBlbHNlIGlmIChkaWZmZXJlbnRCb2R5KSB7XG4gICAgICAgIC8vIE90aGVyd2lzZSwgY2FsY3VsYXRlIHRoZSByYXRpbyBzIC8gciwgIHdoZXJlIHMgaXMgdGhlIHdpZHRoIG9mIHRoZSByZWdpb25cbiAgICAgICAgLy8gcmVwcmVzZW50ZWQgYnkgdGhlIGludGVybmFsIG5vZGUsIGFuZCByIGlzIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBib2R5XG4gICAgICAgIC8vIGFuZCB0aGUgbm9kZSdzIGNlbnRlci1vZi1tYXNzXG4gICAgICAgIGR4ID0gbm9kZS5tYXNzWCAvIG5vZGUubWFzcyAtIHNvdXJjZUJvZHkucG9zLng7XG4gICAgICAgIGR5ID0gbm9kZS5tYXNzWSAvIG5vZGUubWFzcyAtIHNvdXJjZUJvZHkucG9zLnk7XG4gICAgICAgIHIgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuXG4gICAgICAgIGlmIChyID09PSAwKSB7XG4gICAgICAgICAgLy8gU29ycnkgYWJvdXQgY29kZSBkdXBsdWNhdGlvbi4gSSBkb24ndCB3YW50IHRvIGNyZWF0ZSBtYW55IGZ1bmN0aW9uc1xuICAgICAgICAgIC8vIHJpZ2h0IGF3YXkuIEp1c3Qgd2FudCB0byBzZWUgcGVyZm9ybWFuY2UgZmlyc3QuXG4gICAgICAgICAgZHggPSAoTWF0aC5yYW5kb20oKSAtIDAuNSkgLyA1MDtcbiAgICAgICAgICBkeSA9IChNYXRoLnJhbmRvbSgpIC0gMC41KSAvIDUwO1xuICAgICAgICAgIHIgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIElmIHMgLyByIDwgzrgsIHRyZWF0IHRoaXMgaW50ZXJuYWwgbm9kZSBhcyBhIHNpbmdsZSBib2R5LCBhbmQgY2FsY3VsYXRlIHRoZVxuICAgICAgICAvLyBmb3JjZSBpdCBleGVydHMgb24gc291cmNlQm9keSwgYW5kIGFkZCB0aGlzIGFtb3VudCB0byBzb3VyY2VCb2R5J3MgbmV0IGZvcmNlLlxuICAgICAgICBpZiAoKG5vZGUucmlnaHQgLSBub2RlLmxlZnQpIC8gciA8IHRoZXRhKSB7XG4gICAgICAgICAgLy8gaW4gdGhlIGlmIHN0YXRlbWVudCBhYm92ZSB3ZSBjb25zaWRlciBub2RlJ3Mgd2lkdGggb25seVxuICAgICAgICAgIC8vIGJlY2F1c2UgdGhlIHJlZ2lvbiB3YXMgc3F1YXJpZmllZCBkdXJpbmcgdHJlZSBjcmVhdGlvbi5cbiAgICAgICAgICAvLyBUaHVzIHRoZXJlIGlzIG5vIGRpZmZlcmVuY2UgYmV0d2VlbiB1c2luZyB3aWR0aCBvciBoZWlnaHQuXG4gICAgICAgICAgdiA9IGdyYXZpdHkgKiBub2RlLm1hc3MgKiBzb3VyY2VCb2R5Lm1hc3MgLyAociAqIHIgKiByKTtcbiAgICAgICAgICBmeCArPSB2ICogZHg7XG4gICAgICAgICAgZnkgKz0gdiAqIGR5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIE90aGVyd2lzZSwgcnVuIHRoZSBwcm9jZWR1cmUgcmVjdXJzaXZlbHkgb24gZWFjaCBvZiB0aGUgY3VycmVudCBub2RlJ3MgY2hpbGRyZW4uXG5cbiAgICAgICAgICAvLyBJIGludGVudGlvbmFsbHkgdW5mb2xkZWQgdGhpcyBsb29wLCB0byBzYXZlIHNldmVyYWwgQ1BVIGN5Y2xlcy5cbiAgICAgICAgICBpZiAobm9kZS5xdWFkMCkge1xuICAgICAgICAgICAgcXVldWVbcHVzaElkeF0gPSBub2RlLnF1YWQwO1xuICAgICAgICAgICAgcXVldWVMZW5ndGggKz0gMTtcbiAgICAgICAgICAgIHB1c2hJZHggKz0gMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG5vZGUucXVhZDEpIHtcbiAgICAgICAgICAgIHF1ZXVlW3B1c2hJZHhdID0gbm9kZS5xdWFkMTtcbiAgICAgICAgICAgIHF1ZXVlTGVuZ3RoICs9IDE7XG4gICAgICAgICAgICBwdXNoSWR4ICs9IDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChub2RlLnF1YWQyKSB7XG4gICAgICAgICAgICBxdWV1ZVtwdXNoSWR4XSA9IG5vZGUucXVhZDI7XG4gICAgICAgICAgICBxdWV1ZUxlbmd0aCArPSAxO1xuICAgICAgICAgICAgcHVzaElkeCArPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobm9kZS5xdWFkMykge1xuICAgICAgICAgICAgcXVldWVbcHVzaElkeF0gPSBub2RlLnF1YWQzO1xuICAgICAgICAgICAgcXVldWVMZW5ndGggKz0gMTtcbiAgICAgICAgICAgIHB1c2hJZHggKz0gMTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBzb3VyY2VCb2R5LmZvcmNlLnggKz0gZng7XG4gICAgc291cmNlQm9keS5mb3JjZS55ICs9IGZ5O1xuICB9XG5cbiAgZnVuY3Rpb24gaW5zZXJ0Qm9kaWVzKGJvZGllcykge1xuICAgIGlmKCBib2RpZXMubGVuZ3RoID09PSAwICl7IHJldHVybjsgfVxuXG4gICAgbGV0IHgxID0gTnVtYmVyLk1BWF9WQUxVRSxcbiAgICAgIHkxID0gTnVtYmVyLk1BWF9WQUxVRSxcbiAgICAgIHgyID0gTnVtYmVyLk1JTl9WQUxVRSxcbiAgICAgIHkyID0gTnVtYmVyLk1JTl9WQUxVRSxcbiAgICAgIGksXG4gICAgICBtYXggPSBib2RpZXMubGVuZ3RoO1xuXG4gICAgLy8gVG8gcmVkdWNlIHF1YWQgdHJlZSBkZXB0aCB3ZSBhcmUgbG9va2luZyBmb3IgZXhhY3QgYm91bmRpbmcgYm94IG9mIGFsbCBwYXJ0aWNsZXMuXG4gICAgaSA9IG1heDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBsZXQgeCA9IGJvZGllc1tpXS5wb3MueDtcbiAgICAgIGxldCB5ID0gYm9kaWVzW2ldLnBvcy55O1xuICAgICAgaWYgKHggPCB4MSkge1xuICAgICAgICB4MSA9IHg7XG4gICAgICB9XG4gICAgICBpZiAoeCA+IHgyKSB7XG4gICAgICAgIHgyID0geDtcbiAgICAgIH1cbiAgICAgIGlmICh5IDwgeTEpIHtcbiAgICAgICAgeTEgPSB5O1xuICAgICAgfVxuICAgICAgaWYgKHkgPiB5Mikge1xuICAgICAgICB5MiA9IHk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU3F1YXJpZnkgdGhlIGJvdW5kcy5cbiAgICBsZXQgZHggPSB4MiAtIHgxLFxuICAgICAgZHkgPSB5MiAtIHkxO1xuICAgIGlmIChkeCA+IGR5KSB7XG4gICAgICB5MiA9IHkxICsgZHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHgyID0geDEgKyBkeTtcbiAgICB9XG5cbiAgICBjdXJyZW50SW5DYWNoZSA9IDA7XG4gICAgcm9vdCA9IG5ld05vZGUoKTtcbiAgICByb290LmxlZnQgPSB4MTtcbiAgICByb290LnJpZ2h0ID0geDI7XG4gICAgcm9vdC50b3AgPSB5MTtcbiAgICByb290LmJvdHRvbSA9IHkyO1xuXG4gICAgaSA9IG1heCAtIDE7XG4gICAgaWYgKGkgPj0gMCkge1xuICAgICAgcm9vdC5ib2R5ID0gYm9kaWVzW2ldO1xuICAgIH1cbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICBpbnNlcnQoYm9kaWVzW2ldLCByb290KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpbnNlcnQobmV3Qm9keSkge1xuICAgIGluc2VydFN0YWNrLnJlc2V0KCk7XG4gICAgaW5zZXJ0U3RhY2sucHVzaChyb290LCBuZXdCb2R5KTtcblxuICAgIHdoaWxlICghaW5zZXJ0U3RhY2suaXNFbXB0eSgpKSB7XG4gICAgICBsZXQgc3RhY2tJdGVtID0gaW5zZXJ0U3RhY2sucG9wKCksXG4gICAgICAgIG5vZGUgPSBzdGFja0l0ZW0ubm9kZSxcbiAgICAgICAgYm9keSA9IHN0YWNrSXRlbS5ib2R5O1xuXG4gICAgICBpZiAoIW5vZGUuYm9keSkge1xuICAgICAgICAvLyBUaGlzIGlzIGludGVybmFsIG5vZGUuIFVwZGF0ZSB0aGUgdG90YWwgbWFzcyBvZiB0aGUgbm9kZSBhbmQgY2VudGVyLW9mLW1hc3MuXG4gICAgICAgIGxldCB4ID0gYm9keS5wb3MueDtcbiAgICAgICAgbGV0IHkgPSBib2R5LnBvcy55O1xuICAgICAgICBub2RlLm1hc3MgPSBub2RlLm1hc3MgKyBib2R5Lm1hc3M7XG4gICAgICAgIG5vZGUubWFzc1ggPSBub2RlLm1hc3NYICsgYm9keS5tYXNzICogeDtcbiAgICAgICAgbm9kZS5tYXNzWSA9IG5vZGUubWFzc1kgKyBib2R5Lm1hc3MgKiB5O1xuXG4gICAgICAgIC8vIFJlY3Vyc2l2ZWx5IGluc2VydCB0aGUgYm9keSBpbiB0aGUgYXBwcm9wcmlhdGUgcXVhZHJhbnQuXG4gICAgICAgIC8vIEJ1dCBmaXJzdCBmaW5kIHRoZSBhcHByb3ByaWF0ZSBxdWFkcmFudC5cbiAgICAgICAgbGV0IHF1YWRJZHggPSAwLCAvLyBBc3N1bWUgd2UgYXJlIGluIHRoZSAwJ3MgcXVhZC5cbiAgICAgICAgICBsZWZ0ID0gbm9kZS5sZWZ0LFxuICAgICAgICAgIHJpZ2h0ID0gKG5vZGUucmlnaHQgKyBsZWZ0KSAvIDIsXG4gICAgICAgICAgdG9wID0gbm9kZS50b3AsXG4gICAgICAgICAgYm90dG9tID0gKG5vZGUuYm90dG9tICsgdG9wKSAvIDI7XG5cbiAgICAgICAgaWYgKHggPiByaWdodCkgeyAvLyBzb21ld2hlcmUgaW4gdGhlIGVhc3Rlcm4gcGFydC5cbiAgICAgICAgICBxdWFkSWR4ID0gcXVhZElkeCArIDE7XG4gICAgICAgICAgbGVmdCA9IHJpZ2h0O1xuICAgICAgICAgIHJpZ2h0ID0gbm9kZS5yaWdodDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeSA+IGJvdHRvbSkgeyAvLyBhbmQgaW4gc291dGguXG4gICAgICAgICAgcXVhZElkeCA9IHF1YWRJZHggKyAyO1xuICAgICAgICAgIHRvcCA9IGJvdHRvbTtcbiAgICAgICAgICBib3R0b20gPSBub2RlLmJvdHRvbTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjaGlsZCA9IGdldENoaWxkKG5vZGUsIHF1YWRJZHgpO1xuICAgICAgICBpZiAoIWNoaWxkKSB7XG4gICAgICAgICAgLy8gVGhlIG5vZGUgaXMgaW50ZXJuYWwgYnV0IHRoaXMgcXVhZHJhbnQgaXMgbm90IHRha2VuLiBBZGRcbiAgICAgICAgICAvLyBzdWJub2RlIHRvIGl0LlxuICAgICAgICAgIGNoaWxkID0gbmV3Tm9kZSgpO1xuICAgICAgICAgIGNoaWxkLmxlZnQgPSBsZWZ0O1xuICAgICAgICAgIGNoaWxkLnRvcCA9IHRvcDtcbiAgICAgICAgICBjaGlsZC5yaWdodCA9IHJpZ2h0O1xuICAgICAgICAgIGNoaWxkLmJvdHRvbSA9IGJvdHRvbTtcbiAgICAgICAgICBjaGlsZC5ib2R5ID0gYm9keTtcblxuICAgICAgICAgIHNldENoaWxkKG5vZGUsIHF1YWRJZHgsIGNoaWxkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBjb250aW51ZSBzZWFyY2hpbmcgaW4gdGhpcyBxdWFkcmFudC5cbiAgICAgICAgICBpbnNlcnRTdGFjay5wdXNoKGNoaWxkLCBib2R5KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gV2UgYXJlIHRyeWluZyB0byBhZGQgdG8gdGhlIGxlYWYgbm9kZS5cbiAgICAgICAgLy8gV2UgaGF2ZSB0byBjb252ZXJ0IGN1cnJlbnQgbGVhZiBpbnRvIGludGVybmFsIG5vZGVcbiAgICAgICAgLy8gYW5kIGNvbnRpbnVlIGFkZGluZyB0d28gbm9kZXMuXG4gICAgICAgIGxldCBvbGRCb2R5ID0gbm9kZS5ib2R5O1xuICAgICAgICBub2RlLmJvZHkgPSBudWxsOyAvLyBpbnRlcm5hbCBub2RlcyBkbyBub3QgY2FyeSBib2RpZXNcblxuICAgICAgICBpZiAoaXNTYW1lUG9zaXRpb24ob2xkQm9keS5wb3MsIGJvZHkucG9zKSkge1xuICAgICAgICAgIC8vIFByZXZlbnQgaW5maW5pdGUgc3ViZGl2aXNpb24gYnkgYnVtcGluZyBvbmUgbm9kZVxuICAgICAgICAgIC8vIGFueXdoZXJlIGluIHRoaXMgcXVhZHJhbnRcbiAgICAgICAgICBsZXQgcmV0cmllc0NvdW50ID0gMztcbiAgICAgICAgICBkbyB7XG4gICAgICAgICAgICBsZXQgb2Zmc2V0ID0gTWF0aC5yYW5kb20oKTtcbiAgICAgICAgICAgIGxldCBkeCA9IChub2RlLnJpZ2h0IC0gbm9kZS5sZWZ0KSAqIG9mZnNldDtcbiAgICAgICAgICAgIGxldCBkeSA9IChub2RlLmJvdHRvbSAtIG5vZGUudG9wKSAqIG9mZnNldDtcblxuICAgICAgICAgICAgb2xkQm9keS5wb3MueCA9IG5vZGUubGVmdCArIGR4O1xuICAgICAgICAgICAgb2xkQm9keS5wb3MueSA9IG5vZGUudG9wICsgZHk7XG4gICAgICAgICAgICByZXRyaWVzQ291bnQgLT0gMTtcbiAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBkb24ndCBidW1wIGl0IG91dCBvZiB0aGUgYm94LiBJZiB3ZSBkbywgbmV4dCBpdGVyYXRpb24gc2hvdWxkIGZpeCBpdFxuICAgICAgICAgIH0gd2hpbGUgKHJldHJpZXNDb3VudCA+IDAgJiYgaXNTYW1lUG9zaXRpb24ob2xkQm9keS5wb3MsIGJvZHkucG9zKSk7XG5cbiAgICAgICAgICBpZiAocmV0cmllc0NvdW50ID09PSAwICYmIGlzU2FtZVBvc2l0aW9uKG9sZEJvZHkucG9zLCBib2R5LnBvcykpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgdmVyeSBiYWQsIHdlIHJhbiBvdXQgb2YgcHJlY2lzaW9uLlxuICAgICAgICAgICAgLy8gaWYgd2UgZG8gbm90IHJldHVybiBmcm9tIHRoZSBtZXRob2Qgd2UnbGwgZ2V0IGludG9cbiAgICAgICAgICAgIC8vIGluZmluaXRlIGxvb3AgaGVyZS4gU28gd2Ugc2FjcmlmaWNlIGNvcnJlY3RuZXNzIG9mIGxheW91dCwgYW5kIGtlZXAgdGhlIGFwcCBydW5uaW5nXG4gICAgICAgICAgICAvLyBOZXh0IGxheW91dCBpdGVyYXRpb24gc2hvdWxkIGdldCBsYXJnZXIgYm91bmRpbmcgYm94IGluIHRoZSBmaXJzdCBzdGVwIGFuZCBmaXggdGhpc1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBOZXh0IGl0ZXJhdGlvbiBzaG91bGQgc3ViZGl2aWRlIG5vZGUgZnVydGhlci5cbiAgICAgICAgaW5zZXJ0U3RhY2sucHVzaChub2RlLCBvbGRCb2R5KTtcbiAgICAgICAgaW5zZXJ0U3RhY2sucHVzaChub2RlLCBib2R5KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGluc2VydEJvZGllczogaW5zZXJ0Qm9kaWVzLFxuICAgIHVwZGF0ZUJvZHlGb3JjZTogdXBkYXRlXG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldENoaWxkKG5vZGUsIGlkeCkge1xuICBpZiAoaWR4ID09PSAwKSByZXR1cm4gbm9kZS5xdWFkMDtcbiAgaWYgKGlkeCA9PT0gMSkgcmV0dXJuIG5vZGUucXVhZDE7XG4gIGlmIChpZHggPT09IDIpIHJldHVybiBub2RlLnF1YWQyO1xuICBpZiAoaWR4ID09PSAzKSByZXR1cm4gbm9kZS5xdWFkMztcbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHNldENoaWxkKG5vZGUsIGlkeCwgY2hpbGQpIHtcbiAgaWYgKGlkeCA9PT0gMCkgbm9kZS5xdWFkMCA9IGNoaWxkO1xuICBlbHNlIGlmIChpZHggPT09IDEpIG5vZGUucXVhZDEgPSBjaGlsZDtcbiAgZWxzZSBpZiAoaWR4ID09PSAyKSBub2RlLnF1YWQyID0gY2hpbGQ7XG4gIGVsc2UgaWYgKGlkeCA9PT0gMykgbm9kZS5xdWFkMyA9IGNoaWxkO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgbWFrZVF1YWR0cmVlIH07XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvZXVsZXIvcXVhZHRyZWUvaW5kZXguanMiLCJtb2R1bGUuZXhwb3J0cyA9IEluc2VydFN0YWNrO1xuXG4vKipcbiAqIE91ciBpbXBsbWVudGF0aW9uIG9mIFF1YWRUcmVlIGlzIG5vbi1yZWN1cnNpdmUgdG8gYXZvaWQgR0MgaGl0XG4gKiBUaGlzIGRhdGEgc3RydWN0dXJlIHJlcHJlc2VudCBzdGFjayBvZiBlbGVtZW50c1xuICogd2hpY2ggd2UgYXJlIHRyeWluZyB0byBpbnNlcnQgaW50byBxdWFkIHRyZWUuXG4gKi9cbmZ1bmN0aW9uIEluc2VydFN0YWNrICgpIHtcbiAgICB0aGlzLnN0YWNrID0gW107XG4gICAgdGhpcy5wb3BJZHggPSAwO1xufVxuXG5JbnNlcnRTdGFjay5wcm90b3R5cGUgPSB7XG4gICAgaXNFbXB0eTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBvcElkeCA9PT0gMDtcbiAgICB9LFxuICAgIHB1c2g6IGZ1bmN0aW9uIChub2RlLCBib2R5KSB7XG4gICAgICAgIGxldCBpdGVtID0gdGhpcy5zdGFja1t0aGlzLnBvcElkeF07XG4gICAgICAgIGlmICghaXRlbSkge1xuICAgICAgICAgICAgLy8gd2UgYXJlIHRyeWluZyB0byBhdm9pZCBtZW1vcnkgcHJlc3N1ZTogY3JlYXRlIG5ldyBlbGVtZW50XG4gICAgICAgICAgICAvLyBvbmx5IHdoZW4gYWJzb2x1dGVseSBuZWNlc3NhcnlcbiAgICAgICAgICAgIHRoaXMuc3RhY2tbdGhpcy5wb3BJZHhdID0gbmV3IEluc2VydFN0YWNrRWxlbWVudChub2RlLCBib2R5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGl0ZW0ubm9kZSA9IG5vZGU7XG4gICAgICAgICAgICBpdGVtLmJvZHkgPSBib2R5O1xuICAgICAgICB9XG4gICAgICAgICsrdGhpcy5wb3BJZHg7XG4gICAgfSxcbiAgICBwb3A6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMucG9wSWR4ID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhY2tbLS10aGlzLnBvcElkeF07XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucG9wSWR4ID0gMDtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBJbnNlcnRTdGFja0VsZW1lbnQobm9kZSwgYm9keSkge1xuICAgIHRoaXMubm9kZSA9IG5vZGU7IC8vIFF1YWRUcmVlIG5vZGVcbiAgICB0aGlzLmJvZHkgPSBib2R5OyAvLyBwaHlzaWNhbCBib2R5IHdoaWNoIG5lZWRzIHRvIGJlIGluc2VydGVkIHRvIG5vZGVcbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9ldWxlci9xdWFkdHJlZS9pbnNlcnRTdGFjay5qcyIsIi8qKlxuICogSW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmUgdG8gcmVwcmVzZW50IDJEIFF1YWRUcmVlIG5vZGVcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBOb2RlKCkge1xuICAvLyBib2R5IHN0b3JlZCBpbnNpZGUgdGhpcyBub2RlLiBJbiBxdWFkIHRyZWUgb25seSBsZWFmIG5vZGVzIChieSBjb25zdHJ1Y3Rpb24pXG4gIC8vIGNvbnRhaW4gYm9pZGVzOlxuICB0aGlzLmJvZHkgPSBudWxsO1xuXG4gIC8vIENoaWxkIG5vZGVzIGFyZSBzdG9yZWQgaW4gcXVhZHMuIEVhY2ggcXVhZCBpcyBwcmVzZW50ZWQgYnkgbnVtYmVyOlxuICAvLyAwIHwgMVxuICAvLyAtLS0tLVxuICAvLyAyIHwgM1xuICB0aGlzLnF1YWQwID0gbnVsbDtcbiAgdGhpcy5xdWFkMSA9IG51bGw7XG4gIHRoaXMucXVhZDIgPSBudWxsO1xuICB0aGlzLnF1YWQzID0gbnVsbDtcblxuICAvLyBUb3RhbCBtYXNzIG9mIGN1cnJlbnQgbm9kZVxuICB0aGlzLm1hc3MgPSAwO1xuXG4gIC8vIENlbnRlciBvZiBtYXNzIGNvb3JkaW5hdGVzXG4gIHRoaXMubWFzc1ggPSAwO1xuICB0aGlzLm1hc3NZID0gMDtcblxuICAvLyBib3VuZGluZyBib3ggY29vcmRpbmF0ZXNcbiAgdGhpcy5sZWZ0ID0gMDtcbiAgdGhpcy50b3AgPSAwO1xuICB0aGlzLmJvdHRvbSA9IDA7XG4gIHRoaXMucmlnaHQgPSAwO1xufTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9ldWxlci9xdWFkdHJlZS9ub2RlLmpzIiwiY29uc3QgeyBpbnRlZ3JhdGUgfSA9IHJlcXVpcmUoJy4vaW50ZWdyYXRlJyk7XG5jb25zdCB7IGFwcGx5RHJhZyB9ID0gcmVxdWlyZSgnLi9kcmFnJyk7XG5jb25zdCB7IGFwcGx5U3ByaW5nIH0gPSByZXF1aXJlKCcuL3NwcmluZycpO1xuXG5mdW5jdGlvbiB0aWNrKHsgYm9kaWVzLCBzcHJpbmdzLCBxdWFkdHJlZSwgdGltZVN0ZXAsIGdyYXZpdHksIHRoZXRhLCBkcmFnQ29lZmYsIHB1bGwgfSl7XG4gIC8vIHVwZGF0ZSBib2R5IGZyb20gc2NyYXRjaCBpbiBjYXNlIG9mIGFueSBjaGFuZ2VzXG4gIGJvZGllcy5mb3JFYWNoKCBib2R5ID0+IHtcbiAgICBsZXQgcCA9IGJvZHkuX3NjcmF0Y2g7XG5cbiAgICBpZiggIXAgKXsgcmV0dXJuOyB9XG5cbiAgICBib2R5LmxvY2tlZCA9IHAubG9ja2VkO1xuICAgIGJvZHkuZ3JhYmJlZCA9IHAuZ3JhYmJlZDtcbiAgICBib2R5LnBvcy54ID0gcC54O1xuICAgIGJvZHkucG9zLnkgPSBwLnk7XG4gIH0gKTtcblxuICBxdWFkdHJlZS5pbnNlcnRCb2RpZXMoIGJvZGllcyApO1xuXG4gIGZvciggbGV0IGkgPSAwOyBpIDwgYm9kaWVzLmxlbmd0aDsgaSsrICl7XG4gICAgbGV0IGJvZHkgPSBib2RpZXNbaV07XG5cbiAgICBxdWFkdHJlZS51cGRhdGVCb2R5Rm9yY2UoIGJvZHksIGdyYXZpdHksIHRoZXRhLCBwdWxsICk7XG4gICAgYXBwbHlEcmFnKCBib2R5LCBkcmFnQ29lZmYgKTtcbiAgfVxuXG4gIGZvciggbGV0IGkgPSAwOyBpIDwgc3ByaW5ncy5sZW5ndGg7IGkrKyApe1xuICAgIGxldCBzcHJpbmcgPSBzcHJpbmdzW2ldO1xuXG4gICAgYXBwbHlTcHJpbmcoIHNwcmluZyApO1xuICB9XG5cbiAgbGV0IG1vdmVtZW50ID0gaW50ZWdyYXRlKCBib2RpZXMsIHRpbWVTdGVwICk7XG5cbiAgLy8gdXBkYXRlIHNjcmF0Y2ggcG9zaXRpb25zIGZyb20gYm9keSBwb3NpdGlvbnNcbiAgYm9kaWVzLmZvckVhY2goIGJvZHkgPT4ge1xuICAgIGxldCBwID0gYm9keS5fc2NyYXRjaDtcblxuICAgIGlmKCAhcCApeyByZXR1cm47IH1cblxuICAgIHAueCA9IGJvZHkucG9zLng7XG4gICAgcC55ID0gYm9keS5wb3MueTtcbiAgfSApO1xuXG4gIHJldHVybiBtb3ZlbWVudDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IHRpY2sgfTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9ldWxlci90aWNrLmpzIiwiY29uc3QgRXVsZXIgPSByZXF1aXJlKCcuL2V1bGVyJyk7XG5cbi8vIHJlZ2lzdGVycyB0aGUgZXh0ZW5zaW9uIG9uIGEgY3l0b3NjYXBlIGxpYiByZWZcbmxldCByZWdpc3RlciA9IGZ1bmN0aW9uKCBjeXRvc2NhcGUgKXtcbiAgaWYoICFjeXRvc2NhcGUgKXsgcmV0dXJuOyB9IC8vIGNhbid0IHJlZ2lzdGVyIGlmIGN5dG9zY2FwZSB1bnNwZWNpZmllZFxuXG4gIGN5dG9zY2FwZSggJ2xheW91dCcsICdldWxlcicsIEV1bGVyICk7IC8vIHJlZ2lzdGVyIHdpdGggY3l0b3NjYXBlLmpzXG59O1xuXG5pZiggdHlwZW9mIGN5dG9zY2FwZSAhPT0gJ3VuZGVmaW5lZCcgKXsgLy8gZXhwb3NlIHRvIGdsb2JhbCBjeXRvc2NhcGUgKGkuZS4gd2luZG93LmN5dG9zY2FwZSlcbiAgcmVnaXN0ZXIoIGN5dG9zY2FwZSApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZ2lzdGVyO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2luZGV4LmpzIiwiLy8gZ2VuZXJhbCBkZWZhdWx0IG9wdGlvbnMgZm9yIGZvcmNlLWRpcmVjdGVkIGxheW91dFxuXG5tb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5mcmVlemUoe1xuICBhbmltYXRlOiB0cnVlLCAvLyB3aGV0aGVyIHRvIHNob3cgdGhlIGxheW91dCBhcyBpdCdzIHJ1bm5pbmc7IHNwZWNpYWwgJ2VuZCcgdmFsdWUgbWFrZXMgdGhlIGxheW91dCBhbmltYXRlIGxpa2UgYSBkaXNjcmV0ZSBsYXlvdXRcbiAgcmVmcmVzaDogMTAsIC8vIG51bWJlciBvZiB0aWNrcyBwZXIgZnJhbWU7IGhpZ2hlciBpcyBmYXN0ZXIgYnV0IG1vcmUgamVya3lcbiAgbWF4SXRlcmF0aW9uczogMTAwMCwgLy8gbWF4IGl0ZXJhdGlvbnMgYmVmb3JlIHRoZSBsYXlvdXQgd2lsbCBiYWlsIG91dFxuICBtYXhTaW11bGF0aW9uVGltZTogNDAwMCwgLy8gbWF4IGxlbmd0aCBpbiBtcyB0byBydW4gdGhlIGxheW91dFxuICB1bmdyYWJpZnlXaGlsZVNpbXVsYXRpbmc6IGZhbHNlLCAvLyBzbyB5b3UgY2FuJ3QgZHJhZyBub2RlcyBkdXJpbmcgbGF5b3V0XG4gIGZpdDogdHJ1ZSwgLy8gb24gZXZlcnkgbGF5b3V0IHJlcG9zaXRpb24gb2Ygbm9kZXMsIGZpdCB0aGUgdmlld3BvcnRcbiAgcGFkZGluZzogMzAsIC8vIHBhZGRpbmcgYXJvdW5kIHRoZSBzaW11bGF0aW9uXG4gIGJvdW5kaW5nQm94OiB1bmRlZmluZWQsIC8vIGNvbnN0cmFpbiBsYXlvdXQgYm91bmRzOyB7IHgxLCB5MSwgeDIsIHkyIH0gb3IgeyB4MSwgeTEsIHcsIGggfVxuXG4gIC8vIGxheW91dCBldmVudCBjYWxsYmFja3NcbiAgcmVhZHk6IGZ1bmN0aW9uKCl7fSwgLy8gb24gbGF5b3V0cmVhZHlcbiAgc3RvcDogZnVuY3Rpb24oKXt9LCAvLyBvbiBsYXlvdXRzdG9wXG5cbiAgLy8gcG9zaXRpb25pbmcgb3B0aW9uc1xuICByYW5kb21pemU6IGZhbHNlLCAvLyB1c2UgcmFuZG9tIG5vZGUgcG9zaXRpb25zIGF0IGJlZ2lubmluZyBvZiBsYXlvdXRcbiAgXG4gIC8vIGluZmluaXRlIGxheW91dCBvcHRpb25zXG4gIGluZmluaXRlOiBmYWxzZSAvLyBvdmVycmlkZXMgYWxsIG90aGVyIG9wdGlvbnMgZm9yIGEgZm9yY2VzLWFsbC10aGUtdGltZSBtb2RlXG59KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9sYXlvdXQvZGVmYXVsdHMuanMiLCIvKipcbkEgZ2VuZXJpYyBjb250aW51b3VzIGxheW91dCBjbGFzc1xuKi9cblxuY29uc3QgYXNzaWduID0gcmVxdWlyZSgnLi4vYXNzaWduJyk7XG5jb25zdCBkZWZhdWx0cyA9IHJlcXVpcmUoJy4vZGVmYXVsdHMnKTtcbmNvbnN0IG1ha2VCb3VuZGluZ0JveCA9IHJlcXVpcmUoJy4vbWFrZS1iYicpO1xuY29uc3QgeyBzZXRJbml0aWFsUG9zaXRpb25TdGF0ZSwgcmVmcmVzaFBvc2l0aW9ucywgZ2V0Tm9kZVBvc2l0aW9uRGF0YSB9ID0gcmVxdWlyZSgnLi9wb3NpdGlvbicpO1xuY29uc3QgeyBtdWx0aXRpY2sgfSA9IHJlcXVpcmUoJy4vdGljaycpO1xuXG5jbGFzcyBMYXlvdXQge1xuICBjb25zdHJ1Y3Rvciggb3B0aW9ucyApe1xuICAgIGxldCBvID0gdGhpcy5vcHRpb25zID0gYXNzaWduKCB7fSwgZGVmYXVsdHMsIG9wdGlvbnMgKTtcblxuICAgIGxldCBzID0gdGhpcy5zdGF0ZSA9IGFzc2lnbigge30sIG8sIHtcbiAgICAgIGxheW91dDogdGhpcyxcbiAgICAgIG5vZGVzOiBvLmVsZXMubm9kZXMoKSxcbiAgICAgIGVkZ2VzOiBvLmVsZXMuZWRnZXMoKSxcbiAgICAgIHRpY2tJbmRleDogMCxcbiAgICAgIGZpcnN0VXBkYXRlOiB0cnVlXG4gICAgfSApO1xuXG4gICAgcy5hbmltYXRlRW5kID0gby5hbmltYXRlICYmIG8uYW5pbWF0ZSA9PT0gJ2VuZCc7XG4gICAgcy5hbmltYXRlQ29udGludW91c2x5ID0gby5hbmltYXRlICYmICFzLmFuaW1hdGVFbmQ7XG4gIH1cblxuICBydW4oKXtcbiAgICBsZXQgbCA9IHRoaXM7XG4gICAgbGV0IHMgPSB0aGlzLnN0YXRlO1xuXG4gICAgcy50aWNrSW5kZXggPSAwO1xuICAgIHMuZmlyc3RVcGRhdGUgPSB0cnVlO1xuICAgIHMuc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBzLnJ1bm5pbmcgPSB0cnVlO1xuXG4gICAgcy5jdXJyZW50Qm91bmRpbmdCb3ggPSBtYWtlQm91bmRpbmdCb3goIHMuYm91bmRpbmdCb3gsIHMuY3kgKTtcblxuICAgIGlmKCBzLnJlYWR5ICl7IGwub25lKCAncmVhZHknLCBzLnJlYWR5ICk7IH1cbiAgICBpZiggcy5zdG9wICl7IGwub25lKCAnc3RvcCcsIHMuc3RvcCApOyB9XG5cbiAgICBzLm5vZGVzLmZvckVhY2goIG4gPT4gc2V0SW5pdGlhbFBvc2l0aW9uU3RhdGUoIG4sIHMgKSApO1xuXG4gICAgbC5wcmVydW4oIHMgKTtcblxuICAgIGlmKCBzLmFuaW1hdGVDb250aW51b3VzbHkgKXtcbiAgICAgIGxldCB1bmdyYWJpZnkgPSBub2RlID0+IHtcbiAgICAgICAgaWYoICFzLnVuZ3JhYmlmeVdoaWxlU2ltdWxhdGluZyApeyByZXR1cm47IH1cblxuICAgICAgICBsZXQgZ3JhYmJhYmxlID0gZ2V0Tm9kZVBvc2l0aW9uRGF0YSggbm9kZSwgcyApLmdyYWJiYWJsZSA9IG5vZGUuZ3JhYmJhYmxlKCk7XG5cbiAgICAgICAgaWYoIGdyYWJiYWJsZSApe1xuICAgICAgICAgIG5vZGUudW5ncmFiaWZ5KCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGxldCByZWdyYWJpZnkgPSBub2RlID0+IHtcbiAgICAgICAgaWYoICFzLnVuZ3JhYmlmeVdoaWxlU2ltdWxhdGluZyApeyByZXR1cm47IH1cblxuICAgICAgICBsZXQgZ3JhYmJhYmxlID0gZ2V0Tm9kZVBvc2l0aW9uRGF0YSggbm9kZSwgcyApLmdyYWJiYWJsZTtcblxuICAgICAgICBpZiggZ3JhYmJhYmxlICl7XG4gICAgICAgICAgbm9kZS5ncmFiaWZ5KCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGxldCB1cGRhdGVHcmFiU3RhdGUgPSBub2RlID0+IGdldE5vZGVQb3NpdGlvbkRhdGEoIG5vZGUsIHMgKS5ncmFiYmVkID0gbm9kZS5ncmFiYmVkKCk7XG5cbiAgICAgIGxldCBvbkdyYWIgPSBmdW5jdGlvbih7IHRhcmdldCB9KXtcbiAgICAgICAgdXBkYXRlR3JhYlN0YXRlKCB0YXJnZXQgKTtcbiAgICAgIH07XG5cbiAgICAgIGxldCBvbkZyZWUgPSBvbkdyYWI7XG5cbiAgICAgIGxldCBvbkRyYWcgPSBmdW5jdGlvbih7IHRhcmdldCB9KXtcbiAgICAgICAgbGV0IHAgPSBnZXROb2RlUG9zaXRpb25EYXRhKCB0YXJnZXQsIHMgKTtcbiAgICAgICAgbGV0IHRwID0gdGFyZ2V0LnBvc2l0aW9uKCk7XG5cbiAgICAgICAgcC54ID0gdHAueDtcbiAgICAgICAgcC55ID0gdHAueTtcbiAgICAgIH07XG5cbiAgICAgIGxldCBsaXN0ZW5Ub0dyYWIgPSBub2RlID0+IHtcbiAgICAgICAgbm9kZS5vbignZ3JhYicsIG9uR3JhYik7XG4gICAgICAgIG5vZGUub24oJ2ZyZWUnLCBvbkZyZWUpO1xuICAgICAgICBub2RlLm9uKCdkcmFnJywgb25EcmFnKTtcbiAgICAgIH07XG5cbiAgICAgIGxldCB1bmxpc3RlblRvR3JhYiA9IG5vZGUgPT4ge1xuICAgICAgICBub2RlLnJlbW92ZUxpc3RlbmVyKCdncmFiJywgb25HcmFiKTtcbiAgICAgICAgbm9kZS5yZW1vdmVMaXN0ZW5lcignZnJlZScsIG9uRnJlZSk7XG4gICAgICAgIG5vZGUucmVtb3ZlTGlzdGVuZXIoJ2RyYWcnLCBvbkRyYWcpO1xuICAgICAgfTtcblxuICAgICAgbGV0IGZpdCA9ICgpID0+IHtcbiAgICAgICAgaWYoIHMuZml0ICYmIHMuYW5pbWF0ZUNvbnRpbnVvdXNseSApe1xuICAgICAgICAgIHMuY3kuZml0KCBzLnBhZGRpbmcgKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgbGV0IG9uTm90RG9uZSA9ICgpID0+IHtcbiAgICAgICAgcmVmcmVzaFBvc2l0aW9ucyggcy5ub2RlcywgcyApO1xuICAgICAgICBmaXQoKTtcblxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoIGZyYW1lICk7XG4gICAgICB9O1xuXG4gICAgICBsZXQgZnJhbWUgPSBmdW5jdGlvbigpe1xuICAgICAgICBtdWx0aXRpY2soIHMsIG9uTm90RG9uZSwgb25Eb25lICk7XG4gICAgICB9O1xuXG4gICAgICBsZXQgb25Eb25lID0gKCkgPT4ge1xuICAgICAgICByZWZyZXNoUG9zaXRpb25zKCBzLm5vZGVzLCBzICk7XG4gICAgICAgIGZpdCgpO1xuXG4gICAgICAgIHMubm9kZXMuZm9yRWFjaCggbiA9PiB7XG4gICAgICAgICAgcmVncmFiaWZ5KCBuICk7XG4gICAgICAgICAgdW5saXN0ZW5Ub0dyYWIoIG4gKTtcbiAgICAgICAgfSApO1xuXG4gICAgICAgIHMucnVubmluZyA9IGZhbHNlO1xuXG4gICAgICAgIGwuZW1pdCgnbGF5b3V0c3RvcCcpO1xuICAgICAgfTtcblxuICAgICAgbC5lbWl0KCdsYXlvdXRzdGFydCcpO1xuXG4gICAgICBzLm5vZGVzLmZvckVhY2goIG4gPT4ge1xuICAgICAgICB1bmdyYWJpZnkoIG4gKTtcbiAgICAgICAgbGlzdGVuVG9HcmFiKCBuICk7XG4gICAgICB9ICk7XG5cbiAgICAgIGZyYW1lKCk7IC8vIGtpY2sgb2ZmXG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBkb25lID0gZmFsc2U7XG4gICAgICBsZXQgb25Ob3REb25lID0gKCkgPT4ge307XG4gICAgICBsZXQgb25Eb25lID0gKCkgPT4gZG9uZSA9IHRydWU7XG5cbiAgICAgIHdoaWxlKCAhZG9uZSApe1xuICAgICAgICBtdWx0aXRpY2soIHMsIG9uTm90RG9uZSwgb25Eb25lICk7XG4gICAgICB9XG5cbiAgICAgIHMuZWxlcy5sYXlvdXRQb3NpdGlvbnMoIHRoaXMsIHMsIG5vZGUgPT4ge1xuICAgICAgICBsZXQgcGQgPSBnZXROb2RlUG9zaXRpb25EYXRhKCBub2RlLCBzICk7XG5cbiAgICAgICAgcmV0dXJuIHsgeDogcGQueCwgeTogcGQueSB9O1xuICAgICAgfSApO1xuICAgIH1cblxuICAgIGwucG9zdHJ1biggcyApO1xuXG4gICAgcmV0dXJuIHRoaXM7IC8vIGNoYWluaW5nXG4gIH1cblxuICBwcmVydW4oKXt9XG4gIHBvc3RydW4oKXt9XG4gIHRpY2soKXt9XG5cbiAgc3RvcCgpe1xuICAgIHRoaXMuc3RhdGUucnVubmluZyA9IGZhbHNlO1xuXG4gICAgcmV0dXJuIHRoaXM7IC8vIGNoYWluaW5nXG4gIH1cblxuICBkZXN0cm95KCl7XG4gICAgcmV0dXJuIHRoaXM7IC8vIGNoYWluaW5nXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMYXlvdXQ7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvbGF5b3V0L2luZGV4LmpzIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggYmIsIGN5ICl7XG4gIGlmKCBiYiA9PSBudWxsICl7XG4gICAgYmIgPSB7IHgxOiAwLCB5MTogMCwgdzogY3kud2lkdGgoKSwgaDogY3kuaGVpZ2h0KCkgfTtcbiAgfSBlbHNlIHsgLy8gY29weVxuICAgIGJiID0geyB4MTogYmIueDEsIHgyOiBiYi54MiwgeTE6IGJiLnkxLCB5MjogYmIueTIsIHc6IGJiLncsIGg6IGJiLmggfTtcbiAgfVxuXG4gIGlmKCBiYi54MiA9PSBudWxsICl7IGJiLngyID0gYmIueDEgKyBiYi53OyB9XG4gIGlmKCBiYi53ID09IG51bGwgKXsgYmIudyA9IGJiLngyIC0gYmIueDE7IH1cbiAgaWYoIGJiLnkyID09IG51bGwgKXsgYmIueTIgPSBiYi55MSArIGJiLmg7IH1cbiAgaWYoIGJiLmggPT0gbnVsbCApeyBiYi5oID0gYmIueTIgLSBiYi55MTsgfVxuXG4gIHJldHVybiBiYjtcbn07XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvbGF5b3V0L21ha2UtYmIuanMiLCJjb25zdCBhc3NpZ24gPSByZXF1aXJlKCcuLi9hc3NpZ24nKTtcblxubGV0IHNldEluaXRpYWxQb3NpdGlvblN0YXRlID0gZnVuY3Rpb24oIG5vZGUsIHN0YXRlICl7XG4gIGxldCBwID0gbm9kZS5wb3NpdGlvbigpO1xuICBsZXQgYmIgPSBzdGF0ZS5jdXJyZW50Qm91bmRpbmdCb3g7XG4gIGxldCBzY3JhdGNoID0gbm9kZS5zY3JhdGNoKCBzdGF0ZS5uYW1lICk7XG5cbiAgaWYoIHNjcmF0Y2ggPT0gbnVsbCApe1xuICAgIHNjcmF0Y2ggPSB7fTtcblxuICAgIG5vZGUuc2NyYXRjaCggc3RhdGUubmFtZSwgc2NyYXRjaCApO1xuICB9XG5cbiAgYXNzaWduKCBzY3JhdGNoLCBzdGF0ZS5yYW5kb21pemUgPyB7XG4gICAgeDogYmIueDEgKyBNYXRoLnJhbmRvbSgpICogYmIudyxcbiAgICB5OiBiYi55MSArIE1hdGgucmFuZG9tKCkgKiBiYi5oXG4gIH0gOiB7XG4gICAgeDogcC54LFxuICAgIHk6IHAueVxuICB9ICk7XG5cbiAgc2NyYXRjaC5sb2NrZWQgPSBub2RlLmxvY2tlZCgpO1xufTtcblxubGV0IGdldE5vZGVQb3NpdGlvbkRhdGEgPSBmdW5jdGlvbiggbm9kZSwgc3RhdGUgKXtcbiAgcmV0dXJuIG5vZGUuc2NyYXRjaCggc3RhdGUubmFtZSApO1xufTtcblxubGV0IHJlZnJlc2hQb3NpdGlvbnMgPSBmdW5jdGlvbiggbm9kZXMsIHN0YXRlICl7XG4gIG5vZGVzLnBvc2l0aW9ucyhmdW5jdGlvbiggbm9kZSApe1xuICAgIGxldCBzY3JhdGNoID0gbm9kZS5zY3JhdGNoKCBzdGF0ZS5uYW1lICk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgeDogc2NyYXRjaC54LFxuICAgICAgeTogc2NyYXRjaC55XG4gICAgfTtcbiAgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHsgc2V0SW5pdGlhbFBvc2l0aW9uU3RhdGUsIGdldE5vZGVQb3NpdGlvbkRhdGEsIHJlZnJlc2hQb3NpdGlvbnMgfTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9sYXlvdXQvcG9zaXRpb24uanMiLCJjb25zdCBub3AgPSBmdW5jdGlvbigpe307XG5cbmxldCB0aWNrID0gZnVuY3Rpb24oIHN0YXRlICl7XG4gIGxldCBzID0gc3RhdGU7XG4gIGxldCBsID0gc3RhdGUubGF5b3V0O1xuXG4gIGxldCB0aWNrSW5kaWNhdGVzRG9uZSA9IGwudGljayggcyApO1xuXG4gIGlmKCBzLmZpcnN0VXBkYXRlICl7XG4gICAgaWYoIHMuYW5pbWF0ZUNvbnRpbnVvdXNseSApeyAvLyBpbmRpY2F0ZSB0aGUgaW5pdGlhbCBwb3NpdGlvbnMgaGF2ZSBiZWVuIHNldFxuICAgICAgcy5sYXlvdXQuZW1pdCgnbGF5b3V0cmVhZHknKTtcbiAgICB9XG4gICAgcy5maXJzdFVwZGF0ZSA9IGZhbHNlO1xuICB9XG5cbiAgcy50aWNrSW5kZXgrKztcblxuICBsZXQgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gcy5zdGFydFRpbWU7XG5cbiAgcmV0dXJuICFzLmluZmluaXRlICYmICggdGlja0luZGljYXRlc0RvbmUgfHwgcy50aWNrSW5kZXggPj0gcy5tYXhJdGVyYXRpb25zIHx8IGR1cmF0aW9uID49IHMubWF4U2ltdWxhdGlvblRpbWUgKTtcbn07XG5cbmxldCBtdWx0aXRpY2sgPSBmdW5jdGlvbiggc3RhdGUsIG9uTm90RG9uZSA9IG5vcCwgb25Eb25lID0gbm9wICl7XG4gIGxldCBkb25lID0gZmFsc2U7XG4gIGxldCBzID0gc3RhdGU7XG5cbiAgZm9yKCBsZXQgaSA9IDA7IGkgPCBzLnJlZnJlc2g7IGkrKyApe1xuICAgIGRvbmUgPSAhcy5ydW5uaW5nIHx8IHRpY2soIHMgKTtcblxuICAgIGlmKCBkb25lICl7IGJyZWFrOyB9XG4gIH1cblxuICBpZiggIWRvbmUgKXtcbiAgICBvbk5vdERvbmUoKTtcbiAgfSBlbHNlIHtcbiAgICBvbkRvbmUoKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7IHRpY2ssIG11bHRpdGljayB9O1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2xheW91dC90aWNrLmpzIl0sInNvdXJjZVJvb3QiOiIifQ==