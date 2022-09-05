/**
 * cytoscape-bubblesets
 * https://github.com/upsetjs/cytoscape.js-bubblesets
 *
 * Copyright (c) 2021 Samuel Gratzl <sam@sgratzl.com>
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('cytoscape-layers')) :
    typeof define === 'function' && define.amd ? define(['exports', 'cytoscape-layers'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.CytoscapeBubbleSets = {}, global.CytoscapeLayers));
})(this, (function (exports, cytoscapeLayers) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    function __classPrivateFieldGet(receiver, state, kind, f) {
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    }
    function __classPrivateFieldSet(receiver, state, value, kind, f) {
      if (kind === "m") throw new TypeError("Private method is not writable");
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
    }

    /**
     * bubblesets-js
     * https://github.com/upsetjs/bubblesets-js
     *
     * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
     */
    function linePtSegDistSq(lx1, ly1, lx2, ly2, x, y) {
      const x1 = lx1;
      const y1 = ly1;
      const x2 = lx2 - x1;
      const y2 = ly2 - y1;
      let px = x - x1;
      let py = y - y1;
      let dotprod = px * x2 + py * y2;
      let projlenSq = 0;

      if (dotprod <= 0) {
        projlenSq = 0;
      } else {
        px = x2 - px;
        py = y2 - py;
        dotprod = px * x2 + py * y2;

        if (dotprod <= 0) {
          projlenSq = 0;
        } else {
          projlenSq = dotprod * dotprod / (x2 * x2 + y2 * y2);
        }
      }

      const lenSq = px * px + py * py - projlenSq;

      if (lenSq < 0) {
        return 0;
      }

      return lenSq;
    }

    function ptsDistanceSq(x1, y1, x2, y2) {
      return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
    }

    function doublePointsEqual(x1, y1, x2, y2, delta) {
      return ptsDistanceSq(x1, y1, x2, y2) < delta * delta;
    }

    function round(digits) {
      if (!Number.isFinite(digits)) {
        return v => v;
      }

      if (digits === 0) {
        return Math.round;
      }

      const factor = Math.pow(10, digits);
      return v => Math.round(v * factor) / factor;
    }

    function lineBoundingBox(line) {
      const minX = Math.min(line.x1, line.x2);
      const maxX = Math.max(line.x1, line.x2);
      const minY = Math.min(line.y1, line.y2);
      const maxY = Math.max(line.y1, line.y2);
      return {
        x: minX,
        y: minY,
        x2: maxX,
        y2: maxY,
        width: maxX - minX,
        height: maxY - minY
      };
    }

    class Line {
      constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
      }

      equals(that) {
        return this.x1 === that.x1 && this.y1 === that.y1 && this.x2 === that.x2 && this.y2 === that.y2;
      }

      draw(ctx) {
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
      }

      toString() {
        return `Line(from=(${this.x1},${this.y1}),to=(${this.x2},${this.y2}))`;
      }

      static from(l) {
        return new Line(l.x1, l.y1, l.x2, l.y2);
      }

      cuts(px, py) {
        if (this.y1 === this.y2) {
          return false;
        }

        if (py < this.y1 && py <= this.y2 || py > this.y1 && py >= this.y2) {
          return false;
        }

        if (px > this.x1 && px >= this.x2) {
          return false;
        }

        if (px < this.x1 && px <= this.x2) {
          return true;
        }

        const cross = this.x1 + (py - this.y1) * (this.x2 - this.x1) / (this.y2 - this.y1);
        return px <= cross;
      }

      distSquare(x, y) {
        return linePtSegDistSq(this.x1, this.y1, this.x2, this.y2, x, y);
      }

      ptClose(x, y, r) {
        if (this.x1 < this.x2) {
          if (x < this.x1 - r || x > this.x2 + r) {
            return false;
          }
        } else {
          if (x < this.x2 - r || x > this.x1 + r) {
            return false;
          }
        }

        if (this.y1 < this.y2) {
          if (y < this.y1 - r || y > this.y2 + r) {
            return false;
          }
        } else {
          if (y < this.y2 - r || y > this.y1 + r) {
            return false;
          }
        }

        return true;
      }

    }

    var EState;

    (function (EState) {
      EState[EState["POINT"] = 1] = "POINT";
      EState[EState["PARALLEL"] = 2] = "PARALLEL";
      EState[EState["COINCIDENT"] = 3] = "COINCIDENT";
      EState[EState["NONE"] = 4] = "NONE";
    })(EState || (EState = {}));

    class Intersection {
      constructor(state, x = 0, y = 0) {
        this.state = state;
        this.x = x;
        this.y = y;
      }

    }

    function intersectLineLine(la, lb) {
      const uaT = (lb.x2 - lb.x1) * (la.y1 - lb.y1) - (lb.y2 - lb.y1) * (la.x1 - lb.x1);
      const ubT = (la.x2 - la.x1) * (la.y1 - lb.y1) - (la.y2 - la.y1) * (la.x1 - lb.x1);
      const uB = (lb.y2 - lb.y1) * (la.x2 - la.x1) - (lb.x2 - lb.x1) * (la.y2 - la.y1);

      if (uB) {
        const ua = uaT / uB;
        const ub = ubT / uB;

        if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
          return new Intersection(EState.POINT, la.x1 + ua * (la.x2 - la.x1), la.y1 + ua * (la.y2 - la.y1));
        }

        return new Intersection(EState.NONE);
      }

      return new Intersection(uaT == 0 || ubT == 0 ? EState.COINCIDENT : EState.PARALLEL);
    }

    function fractionAlongLineA(la, lb) {
      const uaT = (lb.x2 - lb.x1) * (la.y1 - lb.y1) - (lb.y2 - lb.y1) * (la.x1 - lb.x1);
      const ubT = (la.x2 - la.x1) * (la.y1 - lb.y1) - (la.y2 - la.y1) * (la.x1 - lb.x1);
      const uB = (lb.y2 - lb.y1) * (la.x2 - la.x1) - (lb.x2 - lb.x1) * (la.y2 - la.y1);

      if (uB) {
        const ua = uaT / uB;
        const ub = ubT / uB;

        if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
          return ua;
        }
      }

      return Number.POSITIVE_INFINITY;
    }

    function hasFractionToLineCenter(bounds, line) {
      function testLine(xa, ya, xb, yb) {
        let testDistance = fractionAlongLineA(line, new Line(xa, ya, xb, yb));
        testDistance = Math.abs(testDistance - 0.5);

        if (testDistance >= 0 && testDistance <= 1) {
          return 1;
        }

        return 0;
      }

      let countIntersections = testLine(bounds.x, bounds.y, bounds.x2, bounds.y);
      countIntersections += testLine(bounds.x, bounds.y, bounds.x, bounds.y2);

      if (countIntersections > 1) {
        return true;
      }

      countIntersections += testLine(bounds.x, bounds.y2, bounds.x2, bounds.y2);

      if (countIntersections > 1) {
        return true;
      }

      countIntersections += testLine(bounds.x2, bounds.y, bounds.x2, bounds.y2);
      return countIntersections > 0;
    }

    var OUT_CODE;

    (function (OUT_CODE) {
      OUT_CODE[OUT_CODE["LEFT"] = 0] = "LEFT";
      OUT_CODE[OUT_CODE["TOP"] = 1] = "TOP";
      OUT_CODE[OUT_CODE["RIGHT"] = 2] = "RIGHT";
      OUT_CODE[OUT_CODE["BOTTOM"] = 3] = "BOTTOM";
    })(OUT_CODE || (OUT_CODE = {}));

    function outcode(bounds, px, py) {
      const out = new Set();

      if (bounds.width <= 0) {
        out.add(OUT_CODE.LEFT);
        out.add(OUT_CODE.RIGHT);
      } else if (px < bounds.x) {
        out.add(OUT_CODE.LEFT);
      } else if (px > bounds.x + bounds.width) {
        out.add(OUT_CODE.RIGHT);
      }

      if (bounds.height <= 0) {
        out.add(OUT_CODE.TOP);
        out.add(OUT_CODE.BOTTOM);
      } else if (py < bounds.y) {
        out.add(OUT_CODE.TOP);
      } else if (py > bounds.y + bounds.height) {
        out.add(OUT_CODE.BOTTOM);
      }

      return out;
    }

    function intersectsLine(bounds, line) {
      let x1 = line.x1;
      let y1 = line.y1;
      let x2 = line.x2;
      let y2 = line.y2;
      const out2 = Array.from(outcode(bounds, x2, y2));

      if (out2.length === 0) {
        return true;
      }

      let out1 = outcode(bounds, x1, y1);

      while (out1.size !== 0) {
        if (out2.some(a => out1.has(a))) {
          return false;
        }

        if (out1.has(OUT_CODE.RIGHT) || out1.has(OUT_CODE.LEFT)) {
          let x = bounds.x;

          if (out1.has(OUT_CODE.RIGHT)) {
            x += bounds.width;
          }

          y1 = y1 + (x - x1) * (y2 - y1) / (x2 - x1);
          x1 = x;
        } else {
          let y = bounds.y;

          if (out1.has(OUT_CODE.BOTTOM)) {
            y += bounds.height;
          }

          x1 = x1 + (y - y1) * (x2 - x1) / (y2 - y1);
          y1 = y;
        }

        out1 = outcode(bounds, x1, y1);
      }

      return true;
    }

    function fractionToLineCenter(bounds, line) {
      let minDistance = Number.POSITIVE_INFINITY;
      let countIntersections = 0;

      function testLine(xa, ya, xb, yb) {
        let testDistance = fractionAlongLineA(line, new Line(xa, ya, xb, yb));
        testDistance = Math.abs(testDistance - 0.5);

        if (testDistance >= 0 && testDistance <= 1) {
          countIntersections++;

          if (testDistance < minDistance) {
            minDistance = testDistance;
          }
        }
      }

      testLine(bounds.x, bounds.y, bounds.x2, bounds.y);
      testLine(bounds.x, bounds.y, bounds.x, bounds.y2);

      if (countIntersections > 1) {
        return minDistance;
      }

      testLine(bounds.x, bounds.y2, bounds.x2, bounds.y2);

      if (countIntersections > 1) {
        return minDistance;
      }

      testLine(bounds.x2, bounds.y, bounds.x2, bounds.y2);

      if (countIntersections == 0) {
        return -1;
      }

      return minDistance;
    }

    function testIntersection(line, bounds) {
      let count = 0;
      const top = intersectLineLine(line, new Line(bounds.x, bounds.y, bounds.x2, bounds.y));
      count += top.state === EState.POINT ? 1 : 0;
      const left = intersectLineLine(line, new Line(bounds.x, bounds.y, bounds.x, bounds.y2));
      count += left.state === EState.POINT ? 1 : 0;
      const bottom = intersectLineLine(line, new Line(bounds.x, bounds.y2, bounds.x2, bounds.y2));
      count += bottom.state === EState.POINT ? 1 : 0;
      const right = intersectLineLine(line, new Line(bounds.x2, bounds.y, bounds.x2, bounds.y2));
      count += right.state === EState.POINT ? 1 : 0;
      return {
        top,
        left,
        bottom,
        right,
        count
      };
    }

    class Rectangle {
      constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
      }

      get x2() {
        return this.x + this.width;
      }

      get y2() {
        return this.y + this.height;
      }

      get cx() {
        return this.x + this.width / 2;
      }

      get cy() {
        return this.y + this.height / 2;
      }

      get radius() {
        return Math.max(this.width, this.height) / 2;
      }

      static from(r) {
        return new Rectangle(r.x, r.y, r.width, r.height);
      }

      equals(that) {
        return this.x === that.x && this.y === that.y && this.width === that.width && this.height === that.height;
      }

      clone() {
        return new Rectangle(this.x, this.y, this.width, this.height);
      }

      add(that) {
        const x = Math.min(this.x, that.x);
        const y = Math.min(this.y, that.y);
        const x2 = Math.max(this.x2, that.x + that.width);
        const y2 = Math.max(this.y2, that.y + that.height);
        this.x = x;
        this.y = y;
        this.width = x2 - x;
        this.height = y2 - y;
      }

      addPoint(p) {
        const x = Math.min(this.x, p.x);
        const y = Math.min(this.y, p.y);
        const x2 = Math.max(this.x2, p.x);
        const y2 = Math.max(this.y2, p.y);
        this.x = x;
        this.y = y;
        this.width = x2 - x;
        this.height = y2 - y;
      }

      toString() {
        return `Rectangle[x=${this.x}, y=${this.y}, w=${this.width}, h=${this.height}]`;
      }

      draw(ctx) {
        ctx.rect(this.x, this.y, this.width, this.height);
      }

      containsPt(px, py) {
        return px >= this.x && px <= this.x2 && py >= this.y && py <= this.y2;
      }

      get area() {
        return this.width * this.height;
      }

      intersects(that) {
        if (this.area <= 0 || that.width <= 0 || that.height <= 0) {
          return false;
        }

        return that.x + that.width > this.x && that.y + that.height > this.y && that.x < this.x2 && that.y < this.y2;
      }

      distSquare(tempX, tempY) {
        if (this.containsPt(tempX, tempY)) {
          return 0;
        }

        const code = outcode(this, tempX, tempY);

        if (code.has(OUT_CODE.TOP)) {
          if (code.has(OUT_CODE.LEFT)) {
            return ptsDistanceSq(tempX, tempY, this.x, this.y);
          }

          if (code.has(OUT_CODE.RIGHT)) {
            return ptsDistanceSq(tempX, tempY, this.x2, this.y);
          }

          return (this.y - tempY) * (this.y - tempY);
        }

        if (code.has(OUT_CODE.BOTTOM)) {
          if (code.has(OUT_CODE.LEFT)) {
            return ptsDistanceSq(tempX, tempY, this.x, this.y2);
          }

          if (code.has(OUT_CODE.RIGHT)) {
            return ptsDistanceSq(tempX, tempY, this.x2, this.y2);
          }

          return (tempY - this.y2) * (tempY - this.y2);
        }

        if (code.has(OUT_CODE.LEFT)) {
          return (this.x - tempX) * (this.x - tempX);
        }

        if (code.has(OUT_CODE.RIGHT)) {
          return (tempX - this.x2) * (tempX - this.x2);
        }

        return 0;
      }

    }

    function boundingBox(path) {
      if (path.length === 0) {
        return null;
      }

      const first = path[0];
      const bb = new Rectangle(first.x, first.y, 0, 0);

      for (const point of path) {
        bb.addPoint(point);
      }

      return bb;
    }

    class Circle {
      constructor(cx, cy, radius) {
        this.cx = cx;
        this.cy = cy;
        this.radius = radius;
      }

      get x() {
        return this.cx - this.radius;
      }

      get x2() {
        return this.cx + this.radius;
      }

      get width() {
        return this.radius * 2;
      }

      get y() {
        return this.cy - this.radius;
      }

      get y2() {
        return this.cy + this.radius;
      }

      get height() {
        return this.radius * 2;
      }

      static from(r) {
        return new Circle(r.cx, r.cy, r.radius);
      }

      containsPt(x, y) {
        return ptsDistanceSq(this.cx, this.cy, x, y) < this.radius * this.radius;
      }

      distSquare(tempX, tempY) {
        const dist = ptsDistanceSq(this.cx, this.cy, tempX, tempY);

        if (dist < this.radius * this.radius) {
          return 0;
        }

        const offset = Math.sqrt(dist) - this.radius;
        return offset * offset;
      }

      draw(ctx) {
        ctx.ellipse(this.cx, this.cy, this.radius, this.radius, 0, 0, Math.PI * 2);
      }

    }

    class Area {
      constructor(pixelGroup, i = 0, j = 0, pixelX = 0, pixelY = 0, width, height, pixels = new Float32Array(Math.max(0, width * height)).fill(0)) {
        this.pixelGroup = pixelGroup;
        this.i = i;
        this.j = j;
        this.pixelX = pixelX;
        this.pixelY = pixelY;
        this.width = width;
        this.height = height;
        this.area = pixels;
      }

      createSub(rect, pixelPos) {
        return new Area(this.pixelGroup, rect.x, rect.y, pixelPos.x, pixelPos.y, rect.width, rect.height);
      }

      static fromPixelRegion(pixelRect, pixelGroup) {
        return new Area(pixelGroup, 0, 0, pixelRect.x, pixelRect.y, Math.ceil(pixelRect.width / pixelGroup), Math.ceil(pixelRect.height / pixelGroup));
      }

      copy(sub, pixelPoint) {
        return new Area(this.pixelGroup, this.scaleX(pixelPoint.x), this.scaleY(pixelPoint.y), pixelPoint.x, pixelPoint.y, sub.width, sub.height, sub.area);
      }

      boundX(pos) {
        if (pos < this.i) {
          return this.i;
        }

        if (pos >= this.width) {
          return this.width - 1;
        }

        return pos;
      }

      boundY(pos) {
        if (pos < this.j) {
          return this.j;
        }

        if (pos >= this.height) {
          return this.height - 1;
        }

        return pos;
      }

      scaleX(pixel) {
        return this.boundX(Math.floor((pixel - this.pixelX) / this.pixelGroup));
      }

      scaleY(pixel) {
        return this.boundY(Math.floor((pixel - this.pixelY) / this.pixelGroup));
      }

      scale(pixelRect) {
        const x = this.scaleX(pixelRect.x);
        const y = this.scaleY(pixelRect.y);
        const x2 = this.boundX(Math.ceil((pixelRect.x + pixelRect.width - this.pixelX) / this.pixelGroup));
        const y2 = this.boundY(Math.ceil((pixelRect.y + pixelRect.height - this.pixelY) / this.pixelGroup));
        const width = x2 - x;
        const height = y2 - y;
        return new Rectangle(x, y, width, height);
      }

      invertScaleX(v) {
        return Math.round(v * this.pixelGroup + this.pixelX);
      }

      invertScaleY(v) {
        return Math.round(v * this.pixelGroup + this.pixelY);
      }

      addPadding(rect, pixelPadding) {
        const padding = Math.ceil(pixelPadding / this.pixelGroup);
        const x = this.boundX(rect.x - padding);
        const y = this.boundY(rect.y - padding);
        const x2 = this.boundX(rect.x2 + padding);
        const y2 = this.boundY(rect.y2 + padding);
        const width = x2 - x;
        const height = y2 - y;
        return new Rectangle(x, y, width, height);
      }

      get(i, j) {
        if (i < 0 || j < 0 || i >= this.width || j >= this.height) {
          return Number.NaN;
        }

        return this.area[i + j * this.width];
      }

      inc(i, j, v) {
        if (i < 0 || j < 0 || i >= this.width || j >= this.height) {
          return;
        }

        this.area[i + j * this.width] += v;
      }

      set(i, j, v) {
        if (i < 0 || j < 0 || i >= this.width || j >= this.height) {
          return;
        }

        this.area[i + j * this.width] = v;
      }

      incArea(sub, factor) {
        if (sub.width <= 0 || sub.height <= 0 || factor === 0) {
          return;
        }

        const w = this.width;
        const aw = sub.width;
        const i1 = Math.max(0, sub.i);
        const j1 = Math.max(0, sub.j);
        const i2 = Math.min(sub.i + sub.width, w);
        const j2 = Math.min(sub.j + sub.height, this.height);

        if (j2 <= 0 || i2 <= 0 || i1 >= w || j2 >= this.height) {
          return;
        }

        for (let j = j1; j < j2; j++) {
          const subRow = (j - sub.j) * aw;
          const row = j * w;

          for (let i = i1; i < i2; i++) {
            const v = sub.area[i - sub.i + subRow];

            if (v === 0) {
              continue;
            }

            this.area[i + row] += factor * v;
          }
        }
      }

      fill(value) {
        this.area.fill(value);
      }

      fillArea(rect, value) {
        const offset = rect.x + rect.y * this.width;

        for (let j = 0; j < rect.height; j++) {
          const pos = offset + j * this.width;
          this.area.fill(value, pos, pos + rect.width);
        }
      }

      fillHorizontalLine(i, j, width, value) {
        const offset = i + j * this.width;
        this.area.fill(value, offset, offset + width);
      }

      fillVerticalLine(i, j, height, value) {
        const offset = i + j * this.width;

        for (let i = 0; i < height; i++) {
          this.area[offset + i * this.width] = value;
        }
      }

      clear() {
        this.area.fill(0);
      }

      toString() {
        let r = '';

        for (let j = 0; j < this.height; j++) {
          const row = j * this.width;

          for (let i = 0; i < this.width; i++) {
            const v = this.area[row + i];
            r += v.toFixed(1).padStart(6);
            r += ' ';
          }

          r += '\n';
        }

        return r;
      }

      draw(ctx, offset = true) {
        if (this.width <= 0 || this.height <= 0) {
          return;
        }

        ctx.save();

        if (offset) {
          ctx.translate(this.pixelX, this.pixelY);
        }

        const min = this.area.reduce((acc, v) => Math.min(acc, v), Number.POSITIVE_INFINITY);
        const max = this.area.reduce((acc, v) => Math.max(acc, v), Number.NEGATIVE_INFINITY);

        const scale = v => (v - min) / (max - min);

        ctx.scale(this.pixelGroup, this.pixelGroup);

        for (let i = 0; i < this.width; i++) {
          for (let j = 0; j < this.height; j++) {
            const v = this.area[i + j * this.width];
            ctx.fillStyle = `rgba(0, 0, 0, ${scale(v)})`;
            ctx.fillRect(i, j, 1, 1);
          }
        }

        ctx.restore();
      }

      drawThreshold(ctx, threshold, offset = true) {
        if (this.width <= 0 || this.height <= 0) {
          return;
        }

        ctx.save();

        if (offset) {
          ctx.translate(this.pixelX, this.pixelY);
        }

        ctx.scale(this.pixelGroup, this.pixelGroup);

        for (let i = 0; i < this.width; i++) {
          for (let j = 0; j < this.height; j++) {
            const v = this.area[i + j * this.width];
            ctx.fillStyle = v > threshold ? 'black' : 'white';
            ctx.fillRect(i, j, 1, 1);
          }
        }

        ctx.restore();
      }

    }

    function addPadding(r, padding) {
      const map = r => ({
        x: r.x - padding,
        y: r.y - padding,
        width: r.width + 2 * padding,
        height: r.height + 2 * padding
      });

      if (Array.isArray(r)) {
        return r.map(map);
      }

      return map(r);
    }

    function createLineInfluenceArea(line, potentialArea, padding) {
      return createGenericInfluenceArea(Object.assign(lineBoundingBox(line), {
        distSquare: (x, y) => linePtSegDistSq(line.x1, line.y1, line.x2, line.y2, x, y)
      }), potentialArea, padding);
    }

    function createGenericInfluenceArea(shape, potentialArea, padding) {
      const lr = addPadding(shape, padding);
      const scaled = potentialArea.scale(lr);
      const area = potentialArea.createSub(scaled, lr);
      sample(area, potentialArea, padding, (x, y) => shape.distSquare(x, y));
      return area;
    }

    function sample(area, potentialArea, padding, distanceFunction) {
      const padding2 = padding * padding;

      for (let y = 0; y < area.height; y++) {
        for (let x = 0; x < area.width; x++) {
          const tempX = potentialArea.invertScaleX(area.i + x);
          const tempY = potentialArea.invertScaleY(area.j + y);
          const distanceSq = distanceFunction(tempX, tempY);

          if (distanceSq === 0) {
            area.set(x, y, padding2);
            continue;
          }

          if (distanceSq < padding2) {
            const dr = padding - Math.sqrt(distanceSq);
            area.set(x, y, dr * dr);
          }
        }
      }

      return area;
    }

    function createRectangleInfluenceArea(rect, potentialArea, padding) {
      const scaled = potentialArea.scale(rect);
      const padded = potentialArea.addPadding(scaled, padding);
      const area = potentialArea.createSub(padded, {
        x: rect.x - padding,
        y: rect.y - padding
      });
      const paddingLeft = scaled.x - padded.x;
      const paddingTop = scaled.y - padded.y;
      const paddingRight = padded.x2 - scaled.x2;
      const paddingBottom = padded.y2 - scaled.y2;
      const innerWidth = padded.width - paddingLeft - paddingRight;
      const innerHeight = padded.height - paddingTop - paddingBottom;
      const padding2 = padding * padding;
      area.fillArea({
        x: paddingLeft,
        y: paddingTop,
        width: innerWidth + 1,
        height: innerHeight + 1
      }, padding2);
      const straightDistances = [0];
      const maxPadding = Math.max(paddingTop, paddingLeft, paddingRight, paddingBottom);
      const tempX = potentialArea.invertScaleX(scaled.x + scaled.width / 2);

      for (let i = 1; i < maxPadding; i++) {
        const tempY = potentialArea.invertScaleY(scaled.y - i);
        const distanceSq = rect.distSquare(tempX, tempY);

        if (distanceSq < padding2) {
          const dr = padding - Math.sqrt(distanceSq);
          straightDistances.push(dr * dr);
        } else {
          break;
        }
      }

      const cornerDistances = [];
      const maxHorizontalPadding = Math.max(paddingLeft, paddingRight);
      const maxVerticalPadding = Math.max(paddingTop, paddingRight);

      for (let i = 1; i < maxHorizontalPadding; i++) {
        const tempX = potentialArea.invertScaleX(scaled.x - i);
        const row = [];

        for (let j = 1; j < maxVerticalPadding; j++) {
          const tempY = potentialArea.invertScaleY(scaled.y - j);
          const distanceSq = rect.distSquare(tempX, tempY);

          if (distanceSq < padding2) {
            const dr = padding - Math.sqrt(distanceSq);
            row.push(dr * dr);
          } else {
            row.push(0);
          }
        }

        cornerDistances.push(row);
      }

      for (let y = 1; y < Math.min(paddingTop, straightDistances.length); y++) {
        const value = straightDistances[y];
        area.fillHorizontalLine(paddingLeft, paddingTop - y, innerWidth + 1, value);
      }

      for (let y = 1; y < Math.min(paddingBottom, straightDistances.length); y++) {
        const value = straightDistances[y];
        area.fillHorizontalLine(paddingLeft, paddingTop + innerHeight + y, innerWidth + 1, value);
      }

      for (let x = 1; x < Math.min(paddingLeft, straightDistances.length); x++) {
        const value = straightDistances[x];
        area.fillVerticalLine(paddingLeft - x, paddingTop, innerHeight + 1, value);
      }

      for (let x = 1; x < Math.min(paddingBottom, straightDistances.length); x++) {
        const value = straightDistances[x];
        area.fillVerticalLine(paddingLeft + innerWidth + x, paddingTop, innerHeight + 1, value);
      }

      for (let i = 1; i < paddingLeft; i++) {
        const row = cornerDistances[i - 1];
        const ii = paddingLeft - i;

        for (let j = 1; j < paddingTop; j++) {
          area.set(ii, paddingTop - j, row[j - 1]);
        }

        for (let j = 1; j < paddingBottom; j++) {
          area.set(ii, paddingTop + innerHeight + j, row[j - 1]);
        }
      }

      for (let i = 1; i < paddingRight; i++) {
        const row = cornerDistances[i - 1];
        const ii = paddingLeft + innerWidth + i;

        for (let j = 1; j < paddingTop; j++) {
          area.set(ii, paddingTop - j, row[j - 1]);
        }

        for (let j = 1; j < paddingBottom; j++) {
          area.set(ii, paddingTop + innerHeight + j, row[j - 1]);
        }
      }

      return area;
    }

    function point(x, y) {
      return {
        x,
        y
      };
    }

    function calculateVirtualEdges(items, nonMembers, maxRoutingIterations, morphBuffer) {
      if (items.length === 0) {
        return [];
      }

      const sorted = sortByDistanceToCentroid(items);
      return sorted.map((d, i) => {
        const visited = sorted.slice(0, i);
        return connectItem(nonMembers, d, visited, maxRoutingIterations, morphBuffer);
      }).flat();
    }

    function connectItem(nonMembers, item, visited, maxRoutingIterations, morphBuffer) {
      const itemCenter = point(item.cx, item.cy);
      const closestNeighbor = calculateClosestNeighbor(itemCenter, visited, nonMembers);

      if (closestNeighbor == null) {
        return [];
      }

      const directLine = new Line(itemCenter.x, itemCenter.y, closestNeighbor.cx, closestNeighbor.cy);
      const scannedLines = computeRoute(directLine, nonMembers, maxRoutingIterations, morphBuffer);
      return mergeLines(scannedLines, nonMembers);
    }

    function computeRoute(directLine, nonMembers, maxRoutingIterations, morphBuffer) {
      const scannedLines = [];
      const linesToCheck = [];
      linesToCheck.push(directLine);
      let hasIntersection = true;

      for (let iterations = 0; iterations < maxRoutingIterations && hasIntersection; iterations++) {
        hasIntersection = false;

        while (!hasIntersection && linesToCheck.length > 0) {
          const line = linesToCheck.pop();
          const closestItem = getCenterItem(nonMembers, line);
          const intersections = closestItem ? testIntersection(line, closestItem) : null;

          if (!closestItem || !intersections || intersections.count !== 2) {
            if (!hasIntersection) {
              scannedLines.push(line);
            }

            continue;
          }

          let tempMorphBuffer = morphBuffer;
          let movePoint = rerouteLine(closestItem, tempMorphBuffer, intersections, true);
          let foundFirst = pointExists(movePoint, linesToCheck) || pointExists(movePoint, scannedLines);
          let pointInside = isPointInRectangles(movePoint, nonMembers);

          while (!foundFirst && pointInside && tempMorphBuffer >= 1) {
            tempMorphBuffer /= 1.5;
            movePoint = rerouteLine(closestItem, tempMorphBuffer, intersections, true);
            foundFirst = pointExists(movePoint, linesToCheck) || pointExists(movePoint, scannedLines);
            pointInside = isPointInRectangles(movePoint, nonMembers);
          }

          if (movePoint && !foundFirst && !pointInside) {
            linesToCheck.push(new Line(line.x1, line.y1, movePoint.x, movePoint.y));
            linesToCheck.push(new Line(movePoint.x, movePoint.y, line.x2, line.y2));
            hasIntersection = true;
          }

          if (hasIntersection) {
            continue;
          }

          tempMorphBuffer = morphBuffer;
          movePoint = rerouteLine(closestItem, tempMorphBuffer, intersections, false);
          let foundSecond = pointExists(movePoint, linesToCheck) || pointExists(movePoint, scannedLines);
          pointInside = isPointInRectangles(movePoint, nonMembers);

          while (!foundSecond && pointInside && tempMorphBuffer >= 1) {
            tempMorphBuffer /= 1.5;
            movePoint = rerouteLine(closestItem, tempMorphBuffer, intersections, false);
            foundSecond = pointExists(movePoint, linesToCheck) || pointExists(movePoint, scannedLines);
            pointInside = isPointInRectangles(movePoint, nonMembers);
          }

          if (movePoint && !foundSecond) {
            linesToCheck.push(new Line(line.x1, line.y1, movePoint.x, movePoint.y));
            linesToCheck.push(new Line(movePoint.x, movePoint.y, line.x2, line.y2));
            hasIntersection = true;
          }

          if (!hasIntersection) {
            scannedLines.push(line);
          }
        }
      }

      while (linesToCheck.length > 0) {
        scannedLines.push(linesToCheck.pop());
      }

      return scannedLines;
    }

    function mergeLines(scannedLines, nonMembers) {
      const finalRoute = [];

      while (scannedLines.length > 0) {
        const line1 = scannedLines.pop();

        if (scannedLines.length === 0) {
          finalRoute.push(line1);
          break;
        }

        const line2 = scannedLines.pop();
        const mergeLine = new Line(line1.x1, line1.y1, line2.x2, line2.y2);
        const closestItem = getCenterItem(nonMembers, mergeLine);

        if (!closestItem) {
          scannedLines.push(mergeLine);
        } else {
          finalRoute.push(line1);
          scannedLines.push(line2);
        }
      }

      return finalRoute;
    }

    function calculateClosestNeighbor(itemCenter, visited, nonMembers) {
      let minLengthSq = Number.POSITIVE_INFINITY;
      return visited.reduce((closestNeighbor, neighborItem) => {
        const distanceSq = ptsDistanceSq(itemCenter.x, itemCenter.y, neighborItem.cx, neighborItem.cy);

        if (distanceSq > minLengthSq) {
          return closestNeighbor;
        }

        const directLine = new Line(itemCenter.x, itemCenter.y, neighborItem.cx, neighborItem.cy);
        const numberInterferenceItems = itemsCuttingLine(nonMembers, directLine);

        if (distanceSq * (numberInterferenceItems + 1) * (numberInterferenceItems + 1) < minLengthSq) {
          closestNeighbor = neighborItem;
          minLengthSq = distanceSq * (numberInterferenceItems + 1) * (numberInterferenceItems + 1);
        }

        return closestNeighbor;
      }, null);
    }

    function sortByDistanceToCentroid(items) {
      if (items.length < 2) {
        return items;
      }

      let totalX = 0;
      let totalY = 0;
      items.forEach(item => {
        totalX += item.cx;
        totalY += item.cy;
      });
      totalX /= items.length;
      totalY /= items.length;
      return items.map(item => {
        const diffX = totalX - item.cx;
        const diffY = totalY - item.cy;
        const dist = diffX * diffX + diffY * diffY;
        return [item, dist];
      }).sort((a, b) => a[1] - b[1]).map(d => d[0]);
    }

    function isPointInRectangles(point, rects) {
      return rects.some(r => r.containsPt(point.x, point.y));
    }

    function pointExists(pointToCheck, lines) {
      return lines.some(checkEndPointsLine => {
        if (doublePointsEqual(checkEndPointsLine.x1, checkEndPointsLine.y1, pointToCheck.x, pointToCheck.y, 1e-3)) {
          return true;
        }

        if (doublePointsEqual(checkEndPointsLine.x2, checkEndPointsLine.y2, pointToCheck.x, pointToCheck.y, 1e-3)) {
          return true;
        }

        return false;
      });
    }

    function getCenterItem(items, testLine) {
      let minDistance = Number.POSITIVE_INFINITY;
      let closestItem = null;

      for (const item of items) {
        if (!intersectsLine(item, testLine)) {
          continue;
        }

        const distance = fractionToLineCenter(item, testLine);

        if (distance >= 0 && distance < minDistance) {
          closestItem = item;
          minDistance = distance;
        }
      }

      return closestItem;
    }

    function itemsCuttingLine(items, testLine) {
      return items.reduce((count, item) => {
        if (intersectsLine(item, testLine) && hasFractionToLineCenter(item, testLine)) {
          return count + 1;
        }

        return count;
      }, 0);
    }

    function rerouteLine(item, rerouteBuffer, intersections, wrapNormal) {
      const topIntersect = intersections.top;
      const leftIntersect = intersections.left;
      const bottomIntersect = intersections.bottom;
      const rightIntersect = intersections.right;

      if (wrapNormal) {
        if (leftIntersect.state === EState.POINT) {
          if (topIntersect.state === EState.POINT) return point(item.x - rerouteBuffer, item.y - rerouteBuffer);
          if (bottomIntersect.state === EState.POINT) return point(item.x - rerouteBuffer, item.y2 + rerouteBuffer);
          const totalArea = item.width * item.height;
          const topArea = item.width * ((leftIntersect.y - item.y + (rightIntersect.y - item.y)) * 0.5);

          if (topArea < totalArea * 0.5) {
            if (leftIntersect.y > rightIntersect.y) return point(item.x - rerouteBuffer, item.y - rerouteBuffer);
            return point(item.x2 + rerouteBuffer, item.y - rerouteBuffer);
          }

          if (leftIntersect.y < rightIntersect.y) return point(item.x - rerouteBuffer, item.y2 + rerouteBuffer);
          return point(item.x2 + rerouteBuffer, item.y2 + rerouteBuffer);
        }

        if (rightIntersect.state === EState.POINT) {
          if (topIntersect.state === EState.POINT) return point(item.x2 + rerouteBuffer, item.y - rerouteBuffer);
          if (bottomIntersect.state === EState.POINT) return point(item.x2 + rerouteBuffer, item.y2 + rerouteBuffer);
        }

        const totalArea = item.height * item.width;
        const leftArea = item.height * ((topIntersect.x - item.x + (rightIntersect.x - item.x)) * 0.5);

        if (leftArea < totalArea * 0.5) {
          if (topIntersect.x > bottomIntersect.x) return point(item.x - rerouteBuffer, item.y - rerouteBuffer);
          return point(item.x - rerouteBuffer, item.y2 + rerouteBuffer);
        }

        if (topIntersect.x < bottomIntersect.x) return point(item.x2 + rerouteBuffer, item.y - rerouteBuffer);
        return point(item.x2 + rerouteBuffer, item.y2 + rerouteBuffer);
      }

      if (leftIntersect.state === EState.POINT) {
        if (topIntersect.state === EState.POINT) return point(item.x2 + rerouteBuffer, item.y2 + rerouteBuffer);
        if (bottomIntersect.state === EState.POINT) return point(item.x2 + rerouteBuffer, item.y - rerouteBuffer);
        const totalArea = item.height * item.width;
        const topArea = item.width * ((leftIntersect.y - item.y + (rightIntersect.y - item.y)) * 0.5);

        if (topArea < totalArea * 0.5) {
          if (leftIntersect.y > rightIntersect.y) return point(item.x2 + rerouteBuffer, item.y2 + rerouteBuffer);
          return point(item.x - rerouteBuffer, item.y2 + rerouteBuffer);
        }

        if (leftIntersect.y < rightIntersect.y) return point(item.x2 + rerouteBuffer, item.y - rerouteBuffer);
        return point(item.x - rerouteBuffer, item.y - rerouteBuffer);
      }

      if (rightIntersect.state === EState.POINT) {
        if (topIntersect.state === EState.POINT) return point(item.x - rerouteBuffer, item.y2 + rerouteBuffer);
        if (bottomIntersect.state === EState.POINT) return point(item.x - rerouteBuffer, item.y - rerouteBuffer);
      }

      const totalArea = item.height * item.width;
      const leftArea = item.height * ((topIntersect.x - item.x + (rightIntersect.x - item.x)) * 0.5);

      if (leftArea < totalArea * 0.5) {
        if (topIntersect.x > bottomIntersect.x) return point(item.x2 + rerouteBuffer, item.y2 + rerouteBuffer);
        return point(item.x2 + rerouteBuffer, item.y - rerouteBuffer);
      }

      if (topIntersect.x < bottomIntersect.x) return point(item.x - rerouteBuffer, item.y2 + rerouteBuffer);
      return point(item.x - rerouteBuffer, item.y - rerouteBuffer);
    }

    function canTakeNext(path, start, end, toleranceSquared) {
      const validEnd = path.closed ? end < path.length : end < path.length - 1;

      if (!validEnd) {
        return false;
      }

      const s = path.get(start);
      const e = path.get(end + 1);

      for (let index = start + 1; index <= end; index++) {
        const p = path.get(index);
        const len = linePtSegDistSq(s.x, s.y, e.x, e.y, p.x, p.y);

        if (len > toleranceSquared) {
          return false;
        }
      }

      return true;
    }

    function shapeSimplifier(tolerance = 0.0) {
      return path => {
        if (tolerance < 0 || path.length < 3) {
          return path;
        }

        const points = [];
        let start = 0;
        const toleranceSquared = tolerance * tolerance;

        while (start < path.length) {
          let end = start + 1;

          while (canTakeNext(path, start, end, toleranceSquared)) {
            end++;
          }

          points.push(path.get(start));
          start = end;
        }

        return new PointPath(points);
      };
    }

    function basicFunction(i, t) {
      switch (i) {
        case -2:
          return (((-t + 3.0) * t - 3.0) * t + 1.0) / 6.0;

        case -1:
          return ((3.0 * t - 6.0) * t * t + 4.0) / 6.0;

        case 0:
          return (((-3.0 * t + 3.0) * t + 3.0) * t + 1.0) / 6.0;

        case 1:
          return t * t * t / 6.0;

        default:
          throw new Error('unknown error');
      }
    }

    function bSplineShapeGenerator(granularity = 6.0) {
      const ORDER = 3;
      const START_INDEX = ORDER - 1;
      const REL_END = 1;
      const REL_START = REL_END - ORDER;

      function calcPoint(path, i, t) {
        let px = 0.0;
        let py = 0.0;

        for (let j = REL_START; j <= REL_END; j++) {
          const p = path.get(i + j);
          const bf = basicFunction(j, t);
          px += bf * p.x;
          py += bf * p.y;
        }

        return {
          x: px,
          y: py
        };
      }

      return path => {
        if (path.length < 3) {
          return path;
        }

        const res = [];
        const closed = path.closed;
        const count = path.length + ORDER - 1 + (closed ? 0 : 2);
        res.push(calcPoint(path, START_INDEX - (closed ? 0 : 2), 0));

        for (let ix = START_INDEX - (closed ? 0 : 2); ix < count; ix++) {
          for (let k = 1; k <= granularity; k++) {
            res.push(calcPoint(path, ix, k / granularity));
          }
        }

        return new PointPath(res);
      };
    }

    function samplePath(skip = 8) {
      return path => {
        let actSkip = skip;
        let size = path.length;

        if (actSkip > 1) {
          size = Math.floor(path.length / actSkip);

          while (size < 3 && actSkip > 1) {
            actSkip -= 1;
            size = Math.floor(path.length / actSkip);
          }
        }

        const finalHull = [];

        for (let i = 0, j = 0; j < size; j++, i += actSkip) {
          finalHull.push(path.get(i));
        }

        return new PointPath(finalHull);
      };
    }

    class PointPath {
      constructor(points = [], closed = true) {
        this.points = points;
        this.closed = closed;
      }

      get(index) {
        let i = index;
        const l = this.points.length;

        if (index < 0) {
          return this.closed ? this.get(index + l) : this.points[0];
        } else if (index >= l) {
          return this.closed ? this.get(index - l) : this.points[l - 1];
        }

        return this.points[i];
      }

      get length() {
        return this.points.length;
      }

      toString(roundToDigits = Infinity) {
        const points = this.points;

        if (points.length === 0) {
          return '';
        }

        const rounder = typeof roundToDigits === 'function' ? roundToDigits : round(roundToDigits);
        let r = 'M';

        for (const p of points) {
          r += `${rounder(p.x)},${rounder(p.y)} L`;
        }

        r = r.slice(0, -1);

        if (this.closed) {
          r += ' Z';
        }

        return r;
      }

      draw(ctx) {
        const points = this.points;

        if (points.length === 0) {
          return;
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (const p of points) {
          ctx.lineTo(p.x, p.y);
        }

        if (this.closed) {
          ctx.closePath();
        }
      }

      sample(skip) {
        return samplePath(skip)(this);
      }

      simplify(tolerance) {
        return shapeSimplifier(tolerance)(this);
      }

      bSplines(granularity) {
        return bSplineShapeGenerator(granularity)(this);
      }

      apply(transformer) {
        return transformer(this);
      }

      containsElements(members) {
        const bb = boundingBox(this.points);

        if (!bb) {
          return false;
        }

        return members.every(member => {
          return bb.containsPt(member.cx, member.cy) && this.withinArea(member.cx, member.cy);
        });
      }

      withinArea(px, py) {
        if (this.length === 0) {
          return false;
        }

        let crossings = 0;
        const first = this.points[0];
        const line = new Line(first.x, first.y, first.x, first.y);

        for (let i = 1; i < this.points.length; i++) {
          const cur = this.points[i];
          line.x1 = line.x2;
          line.y1 = line.y2;
          line.x2 = cur.x;
          line.y2 = cur.y;

          if (line.cuts(px, py)) {
            crossings++;
          }
        }

        line.x1 = line.x2;
        line.y1 = line.y2;
        line.x2 = first.x;
        line.y2 = first.y;

        if (line.cuts(px, py)) {
          crossings++;
        }

        return crossings % 2 == 1;
      }

    }

    class PointList {
      constructor(size = 0) {
        this.count = 0;
        this.arr = [];
        this.set = new Set();
        this.arr.length = size;
      }

      add(p) {
        this.set.add(`${p.x}x${p.y}`);
        this.arr[this.count++] = p;
      }

      contains(p) {
        return this.set.has(`${p.x}x${p.y}`);
      }

      isFirst(p) {
        if (this.count === 0) {
          return false;
        }

        const o = this.arr[0];
        return o != null && o.x === p.x && o.y === p.y;
      }

      path() {
        return new PointPath(this.arr.slice(0, this.count));
      }

      clear() {
        this.set.clear();
        this.count = 0;
      }

      get(ix) {
        return this.arr[ix];
      }

      get length() {
        return this.count;
      }

    }

    const N = 0;
    const S = 1;
    const E = 2;
    const W = 3;

    function marchingSquares(potentialArea, threshold) {
      const estLength = (Math.floor(potentialArea.width) + Math.floor(potentialArea.height)) * 2;
      const contour = new PointList(estLength);

      function updateDir(x, y, dir, res) {
        const v = potentialArea.get(x, y);

        if (Number.isNaN(v)) {
          return Number.NaN;
        }

        if (v > threshold) {
          return dir + res;
        }

        return dir;
      }

      function getState(x, y) {
        let dir = N;
        dir = updateDir(x, y, dir, 1);
        dir = updateDir(x + 1, y, dir, 2);
        dir = updateDir(x, y + 1, dir, 4);
        dir = updateDir(x + 1, y + 1, dir, 8);

        if (Number.isNaN(dir)) {
          return -1;
        }

        return dir;
      }

      let direction = S;

      function doMarch(xPos, yPos) {
        let x = xPos;
        let y = yPos;
        let xPixel = potentialArea.invertScaleX(x);
        let yPixel = potentialArea.invertScaleY(y);

        for (let i = 0; i < potentialArea.width * potentialArea.height; i++) {
          const p = {
            x: xPixel,
            y: yPixel
          };

          if (contour.contains(p)) {
            if (!contour.isFirst(p)) ;else {
              return true;
            }
          } else {
            contour.add(p);
          }

          const state = getState(x, y);

          switch (state) {
            case -1:
              return true;

            case 0:
            case 3:
            case 2:
            case 7:
              direction = E;
              break;

            case 12:
            case 14:
            case 4:
              direction = W;
              break;

            case 6:
              direction = direction == N ? W : E;
              break;

            case 1:
            case 13:
            case 5:
              direction = N;
              break;

            case 9:
              direction = direction == E ? N : S;
              break;

            case 10:
            case 8:
            case 11:
              direction = S;
              break;

            default:
              console.warn('Marching squares invalid state: ' + state);
              return true;
          }

          switch (direction) {
            case N:
              y--;
              yPixel -= potentialArea.pixelGroup;
              break;

            case S:
              y++;
              yPixel += potentialArea.pixelGroup;
              break;

            case W:
              x--;
              xPixel -= potentialArea.pixelGroup;
              break;

            case E:
              x++;
              xPixel += potentialArea.pixelGroup;
              break;

            default:
              console.warn('Marching squares invalid state: ' + state);
              return true;
          }
        }

        return true;
      }

      for (let x = 0; x < potentialArea.width; x++) {
        for (let y = 0; y < potentialArea.height; y++) {
          if (potentialArea.get(x, y) <= threshold) {
            continue;
          }

          const state = getState(x, y);

          if (state < 0 || state === 15) {
            continue;
          }

          if (doMarch(x, y)) {
            return contour.path();
          }
        }
      }

      return null;
    }

    const defaultOptions = {
      maxRoutingIterations: 100,
      maxMarchingIterations: 20,
      pixelGroup: 4,
      edgeR0: 10,
      edgeR1: 20,
      nodeR0: 15,
      nodeR1: 50,
      morphBuffer: 10,
      threshold: 1,
      memberInfluenceFactor: 1,
      edgeInfluenceFactor: 1,
      nonMemberInfluenceFactor: -0.8,
      virtualEdges: true
    };

    var EDirty;

    (function (EDirty) {
      EDirty[EDirty["MEMBERS"] = 0] = "MEMBERS";
      EDirty[EDirty["NON_MEMBERS"] = 1] = "NON_MEMBERS";
      EDirty[EDirty["EDGES"] = 2] = "EDGES";
    })(EDirty || (EDirty = {}));

    function calculatePotentialOutline(potentialArea, members, edges, nonMembers, validPath, options = {}) {
      const o = Object.assign({}, defaultOptions, options);
      let threshold = o.threshold;
      let memberInfluenceFactor = o.memberInfluenceFactor;
      let edgeInfluenceFactor = o.edgeInfluenceFactor;
      let nonMemberInfluenceFactor = o.nonMemberInfluenceFactor;
      const nodeInfA = (o.nodeR0 - o.nodeR1) * (o.nodeR0 - o.nodeR1);
      const edgeInfA = (o.edgeR0 - o.edgeR1) * (o.edgeR0 - o.edgeR1);

      for (let iterations = 0; iterations < o.maxMarchingIterations; iterations++) {
        potentialArea.clear();

        if (memberInfluenceFactor !== 0) {
          const f = memberInfluenceFactor / nodeInfA;

          for (const item of members) {
            potentialArea.incArea(item, f);
          }
        }

        if (edgeInfluenceFactor !== 0) {
          const f = edgeInfluenceFactor / edgeInfA;

          for (const area of edges) {
            potentialArea.incArea(area, f);
          }
        }

        if (nonMemberInfluenceFactor !== 0) {
          const f = nonMemberInfluenceFactor / nodeInfA;

          for (const area of nonMembers) {
            potentialArea.incArea(area, f);
          }
        }

        const contour = marchingSquares(potentialArea, threshold);

        if (contour && validPath(contour)) {
          return contour;
        }

        threshold *= 0.95;

        if (iterations <= o.maxMarchingIterations * 0.5) {
          memberInfluenceFactor *= 1.2;
          edgeInfluenceFactor *= 1.2;
        } else if (nonMemberInfluenceFactor != 0 && nonMembers.length > 0) {
          nonMemberInfluenceFactor *= 0.8;
        } else {
          break;
        }
      }

      return new PointPath([]);
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    /**
     * lodash (Custom Build) <https://lodash.com/>
     * Build: `lodash modularize exports="npm" -o ./`
     * Copyright jQuery Foundation and other contributors <https://jquery.org/>
     * Released under MIT license <https://lodash.com/license>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     */
    /** Used as the `TypeError` message for "Functions" methods. */

    var FUNC_ERROR_TEXT = 'Expected a function';
    /** Used as references for various `Number` constants. */

    var NAN = 0 / 0;
    /** `Object#toString` result references. */

    var symbolTag = '[object Symbol]';
    /** Used to match leading and trailing whitespace. */

    var reTrim = /^\s+|\s+$/g;
    /** Used to detect bad signed hexadecimal string values. */

    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    /** Used to detect binary string values. */

    var reIsBinary = /^0b[01]+$/i;
    /** Used to detect octal string values. */

    var reIsOctal = /^0o[0-7]+$/i;
    /** Built-in method references without a dependency on `root`. */

    var freeParseInt = parseInt;
    /** Detect free variable `global` from Node.js. */

    var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
    /** Detect free variable `self`. */

    var freeSelf = typeof self == 'object' && self && self.Object === Object && self;
    /** Used as a reference to the global object. */

    var root = freeGlobal || freeSelf || Function('return this')();
    /** Used for built-in method references. */

    var objectProto = Object.prototype;
    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */

    var objectToString = objectProto.toString;
    /* Built-in method references for those with the same name as other `lodash` methods. */

    var nativeMax = Math.max,
        nativeMin = Math.min;
    /**
     * Gets the timestamp of the number of milliseconds that have elapsed since
     * the Unix epoch (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Date
     * @returns {number} Returns the timestamp.
     * @example
     *
     * _.defer(function(stamp) {
     *   console.log(_.now() - stamp);
     * }, _.now());
     * // => Logs the number of milliseconds it took for the deferred invocation.
     */

    var now = function () {
      return root.Date.now();
    };
    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked. The debounced function comes with a `cancel` method to cancel
     * delayed `func` invocations and a `flush` method to immediately invoke them.
     * Provide `options` to indicate whether `func` should be invoked on the
     * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
     * with the last arguments provided to the debounced function. Subsequent
     * calls to the debounced function return the result of the last `func`
     * invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the debounced function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=false]
     *  Specify invoking on the leading edge of the timeout.
     * @param {number} [options.maxWait]
     *  The maximum time `func` is allowed to be delayed before it's invoked.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // Avoid costly calculations while the window size is in flux.
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // Invoke `sendMail` when clicked, debouncing subsequent calls.
     * jQuery(element).on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
     * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', debounced);
     *
     * // Cancel the trailing debounced invocation.
     * jQuery(window).on('popstate', debounced.cancel);
     */


    function debounce(func, wait, options) {
      var lastArgs,
          lastThis,
          maxWait,
          result,
          timerId,
          lastCallTime,
          lastInvokeTime = 0,
          leading = false,
          maxing = false,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }

      wait = toNumber(wait) || 0;

      if (isObject(options)) {
        leading = !!options.leading;
        maxing = 'maxWait' in options;
        maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }

      function invokeFunc(time) {
        var args = lastArgs,
            thisArg = lastThis;
        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
      }

      function leadingEdge(time) {
        // Reset any `maxWait` timer.
        lastInvokeTime = time; // Start the timer for the trailing edge.

        timerId = setTimeout(timerExpired, wait); // Invoke the leading edge.

        return leading ? invokeFunc(time) : result;
      }

      function remainingWait(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime,
            result = wait - timeSinceLastCall;
        return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
      }

      function shouldInvoke(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime; // Either this is the first call, activity has stopped and we're at the
        // trailing edge, the system time has gone backwards and we're treating
        // it as the trailing edge, or we've hit the `maxWait` limit.

        return lastCallTime === undefined || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
      }

      function timerExpired() {
        var time = now();

        if (shouldInvoke(time)) {
          return trailingEdge(time);
        } // Restart the timer.


        timerId = setTimeout(timerExpired, remainingWait(time));
      }

      function trailingEdge(time) {
        timerId = undefined; // Only invoke if we have `lastArgs` which means `func` has been
        // debounced at least once.

        if (trailing && lastArgs) {
          return invokeFunc(time);
        }

        lastArgs = lastThis = undefined;
        return result;
      }

      function cancel() {
        if (timerId !== undefined) {
          clearTimeout(timerId);
        }

        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = undefined;
      }

      function flush() {
        return timerId === undefined ? result : trailingEdge(now());
      }

      function debounced() {
        var time = now(),
            isInvoking = shouldInvoke(time);
        lastArgs = arguments;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
          if (timerId === undefined) {
            return leadingEdge(lastCallTime);
          }

          if (maxing) {
            // Handle invocations in a tight loop.
            timerId = setTimeout(timerExpired, wait);
            return invokeFunc(lastCallTime);
          }
        }

        if (timerId === undefined) {
          timerId = setTimeout(timerExpired, wait);
        }

        return result;
      }

      debounced.cancel = cancel;
      debounced.flush = flush;
      return debounced;
    }
    /**
     * Creates a throttled function that only invokes `func` at most once per
     * every `wait` milliseconds. The throttled function comes with a `cancel`
     * method to cancel delayed `func` invocations and a `flush` method to
     * immediately invoke them. Provide `options` to indicate whether `func`
     * should be invoked on the leading and/or trailing edge of the `wait`
     * timeout. The `func` is invoked with the last arguments provided to the
     * throttled function. Subsequent calls to the throttled function return the
     * result of the last `func` invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the throttled function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.throttle` and `_.debounce`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to throttle.
     * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=true]
     *  Specify invoking on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // Avoid excessively updating the position while scrolling.
     * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
     *
     * // Invoke `renewToken` when the click event is fired, but not more than once every 5 minutes.
     * var throttled = _.throttle(renewToken, 300000, { 'trailing': false });
     * jQuery(element).on('click', throttled);
     *
     * // Cancel the trailing throttled invocation.
     * jQuery(window).on('popstate', throttled.cancel);
     */


    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }

      if (isObject(options)) {
        leading = 'leading' in options ? !!options.leading : leading;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }

      return debounce(func, wait, {
        'leading': leading,
        'maxWait': wait,
        'trailing': trailing
      });
    }
    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */


    function isObject(value) {
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }
    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */


    function isObjectLike(value) {
      return !!value && typeof value == 'object';
    }
    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */


    function isSymbol(value) {
      return typeof value == 'symbol' || isObjectLike(value) && objectToString.call(value) == symbolTag;
    }
    /**
     * Converts `value` to a number.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {number} Returns the number.
     * @example
     *
     * _.toNumber(3.2);
     * // => 3.2
     *
     * _.toNumber(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toNumber(Infinity);
     * // => Infinity
     *
     * _.toNumber('3.2');
     * // => 3.2
     */


    function toNumber(value) {
      if (typeof value == 'number') {
        return value;
      }

      if (isSymbol(value)) {
        return NAN;
      }

      if (isObject(value)) {
        var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
        value = isObject(other) ? other + '' : other;
      }

      if (typeof value != 'string') {
        return value === 0 ? value : +value;
      }

      value = value.replace(reTrim, '');
      var isBinary = reIsBinary.test(value);
      return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
    }

    var lodash_throttle = throttle;

    var _BubbleSetPath_activeArea, _BubbleSetPath_potentialArea, _BubbleSetPath_options, _BubbleSetPath_virtualEdgeAreas, _BubbleSetPath_throttledUpdate, _BubbleSetPath_adder, _BubbleSetPath_remover, _BubbleSetPath_adapter;
    function round2(v) {
        return Math.round(v * 100) / 100;
    }
    const SCRATCH_KEY = 'bubbleSets';
    const circularBase = ['ellipse', 'diamond', 'diamond', 'pentagon', 'diamond', 'hexagon', 'heptagon', 'octagon', 'star'];
    const circular = new Set(circularBase.concat(circularBase.map((v) => `round-${v}`)));
    function isCircleShape(shape) {
        return circular.has(shape);
    }
    function toNodeKey(data) {
        return `${round2(data.shape.width)}x${round2(data.shape.height)}x${data.isCircle}`;
    }
    function toEdgeKey(line) {
        return `${round2(line.x1)}x${round2(line.y1)}x${round2(line.x2)}x${round2(line.y2)}`;
    }
    function linesEquals(a, b) {
        return a.length === b.length && a.every((ai, i) => toEdgeKey(ai) === toEdgeKey(b[i]));
    }
    function createShape(isCircle, bb) {
        return isCircle
            ? new Circle(bb.x1 + bb.w / 2, bb.y1 + bb.h / 2, Math.max(bb.w, bb.h) / 2)
            : new Rectangle(bb.x1, bb.y1, bb.w, bb.h);
    }
    class BubbleSetPath {
        constructor(adapter, node, nodes, edges, avoidNodes, options = {}) {
            this.node = node;
            this.nodes = nodes;
            this.edges = edges;
            this.avoidNodes = avoidNodes;
            _BubbleSetPath_activeArea.set(this, { x: 0, y: 0, width: 0, height: 0 });
            _BubbleSetPath_potentialArea.set(this, new Area(4, 0, 0, 0, 0, 0, 0));
            _BubbleSetPath_options.set(this, void 0);
            _BubbleSetPath_virtualEdgeAreas.set(this, new Map());
            _BubbleSetPath_throttledUpdate.set(this, void 0);
            _BubbleSetPath_adder.set(this, void 0);
            _BubbleSetPath_remover.set(this, void 0);
            _BubbleSetPath_adapter.set(this, void 0);
            this.update = (forceUpdate = false) => {
                const bb = this.nodes.union(this.edges).boundingBox(__classPrivateFieldGet(this, _BubbleSetPath_options, "f"));
                let potentialAreaDirty = false;
                const padding = Math.max(__classPrivateFieldGet(this, _BubbleSetPath_options, "f").edgeR1, __classPrivateFieldGet(this, _BubbleSetPath_options, "f").nodeR1) + __classPrivateFieldGet(this, _BubbleSetPath_options, "f").morphBuffer;
                const nextPotentialBB = {
                    x: bb.x1 - padding,
                    y: bb.y1 - padding,
                    width: bb.w + padding * 2,
                    height: bb.h + padding * 2,
                };
                if (forceUpdate || __classPrivateFieldGet(this, _BubbleSetPath_activeArea, "f").x !== nextPotentialBB.x || __classPrivateFieldGet(this, _BubbleSetPath_activeArea, "f").y !== nextPotentialBB.y) {
                    potentialAreaDirty = true;
                    __classPrivateFieldSet(this, _BubbleSetPath_potentialArea, Area.fromPixelRegion(nextPotentialBB, __classPrivateFieldGet(this, _BubbleSetPath_options, "f").pixelGroup), "f");
                }
                else if (__classPrivateFieldGet(this, _BubbleSetPath_activeArea, "f").width !== nextPotentialBB.width || __classPrivateFieldGet(this, _BubbleSetPath_activeArea, "f").height !== nextPotentialBB.height) {
                    __classPrivateFieldSet(this, _BubbleSetPath_potentialArea, Area.fromPixelRegion(nextPotentialBB, __classPrivateFieldGet(this, _BubbleSetPath_options, "f").pixelGroup), "f");
                }
                __classPrivateFieldSet(this, _BubbleSetPath_activeArea, nextPotentialBB, "f");
                const potentialArea = __classPrivateFieldGet(this, _BubbleSetPath_potentialArea, "f");
                const cache = new Map();
                if (!potentialAreaDirty) {
                    this.nodes.forEach((n) => {
                        var _a;
                        const data = ((_a = n.scratch(SCRATCH_KEY)) !== null && _a !== void 0 ? _a : null);
                        if (data && data.area) {
                            cache.set(toNodeKey(data), data.area);
                        }
                    });
                }
                let updateEdges = false;
                const updateNodeData = (n) => {
                    var _a;
                    const nodeBB = n.boundingBox(__classPrivateFieldGet(this, _BubbleSetPath_options, "f"));
                    let data = ((_a = n.scratch(SCRATCH_KEY)) !== null && _a !== void 0 ? _a : null);
                    const isCircle = isCircleShape(n.style('shape'));
                    if (!data ||
                        potentialAreaDirty ||
                        !data.area ||
                        data.isCircle !== isCircle ||
                        data.shape.width !== nodeBB.w ||
                        data.shape.height !== nodeBB.h) {
                        updateEdges = true;
                        data = {
                            isCircle,
                            shape: createShape(isCircle, nodeBB),
                        };
                        const key = toNodeKey(data);
                        const cached = cache.get(key);
                        if (cached != null) {
                            data.area = __classPrivateFieldGet(this, _BubbleSetPath_potentialArea, "f").copy(cached, {
                                x: nodeBB.x1 - __classPrivateFieldGet(this, _BubbleSetPath_options, "f").nodeR1,
                                y: nodeBB.y1 - __classPrivateFieldGet(this, _BubbleSetPath_options, "f").nodeR1,
                            });
                        }
                        else {
                            data.area = data.isCircle
                                ? createGenericInfluenceArea(data.shape, potentialArea, __classPrivateFieldGet(this, _BubbleSetPath_options, "f").nodeR1)
                                : createRectangleInfluenceArea(data.shape, potentialArea, __classPrivateFieldGet(this, _BubbleSetPath_options, "f").nodeR1);
                            cache.set(key, data.area);
                        }
                        n.scratch(SCRATCH_KEY, data);
                    }
                    else if (data.shape.x !== nodeBB.x1 || data.shape.y !== nodeBB.y1) {
                        updateEdges = true;
                        data.shape = createShape(isCircle, nodeBB);
                        data.area = __classPrivateFieldGet(this, _BubbleSetPath_potentialArea, "f").copy(data.area, {
                            x: nodeBB.x1 - __classPrivateFieldGet(this, _BubbleSetPath_options, "f").nodeR1,
                            y: nodeBB.y1 - __classPrivateFieldGet(this, _BubbleSetPath_options, "f").nodeR1,
                        });
                    }
                    return data;
                };
                const members = this.nodes.map(updateNodeData);
                const nonMembers = this.avoidNodes.map(updateNodeData);
                const edgeCache = new Map();
                if (!potentialAreaDirty) {
                    __classPrivateFieldGet(this, _BubbleSetPath_virtualEdgeAreas, "f").forEach((value, key) => edgeCache.set(key, value));
                    this.edges.forEach((n) => {
                        var _a;
                        const data = ((_a = n.scratch(SCRATCH_KEY)) !== null && _a !== void 0 ? _a : null);
                        if (data && data.lines) {
                            data.lines.forEach((line, i) => {
                                const area = data.areas[i];
                                if (area) {
                                    cache.set(toEdgeKey(line), area);
                                }
                            });
                        }
                    });
                }
                const updateEdgeArea = (line) => {
                    const key = toEdgeKey(line);
                    const cached = edgeCache.get(key);
                    if (cached != null) {
                        return cached;
                    }
                    const r = createLineInfluenceArea(line, __classPrivateFieldGet(this, _BubbleSetPath_potentialArea, "f"), __classPrivateFieldGet(this, _BubbleSetPath_options, "f").edgeR1);
                    edgeCache.set(key, r);
                    return r;
                };
                const edges = [];
                this.edges.forEach((e) => {
                    var _a, _b;
                    const ps = ((_a = e.segmentPoints()) !== null && _a !== void 0 ? _a : [e.sourceEndpoint(), e.targetEndpoint()]).map((d) => ({ ...d }));
                    if (ps.length === 0) {
                        return;
                    }
                    const lines = ps.slice(1).map((next, i) => {
                        const prev = ps[i];
                        return Line.from({
                            x1: prev.x,
                            y1: prev.y,
                            x2: next.x,
                            y2: next.y,
                        });
                    });
                    let data = ((_b = e.scratch(SCRATCH_KEY)) !== null && _b !== void 0 ? _b : null);
                    if (!data || potentialAreaDirty || !linesEquals(data.lines, lines)) {
                        data = {
                            lines,
                            areas: lines.map(updateEdgeArea),
                        };
                        e.scratch(SCRATCH_KEY, data);
                    }
                    edges.push(...data.areas);
                });
                const memberShapes = members.map((d) => d.shape);
                if (__classPrivateFieldGet(this, _BubbleSetPath_options, "f").virtualEdges) {
                    if (updateEdges) {
                        const nonMembersShapes = nonMembers.map((d) => d.shape);
                        const lines = calculateVirtualEdges(memberShapes, nonMembersShapes, __classPrivateFieldGet(this, _BubbleSetPath_options, "f").maxRoutingIterations, __classPrivateFieldGet(this, _BubbleSetPath_options, "f").morphBuffer);
                        __classPrivateFieldGet(this, _BubbleSetPath_virtualEdgeAreas, "f").clear();
                        lines.forEach((line) => {
                            const area = updateEdgeArea(line);
                            const key = toEdgeKey(line);
                            __classPrivateFieldGet(this, _BubbleSetPath_virtualEdgeAreas, "f").set(key, area);
                            edges.push(area);
                        });
                    }
                    else {
                        __classPrivateFieldGet(this, _BubbleSetPath_virtualEdgeAreas, "f").forEach((area) => edges.push(area));
                    }
                }
                const memberAreas = members.filter((d) => d.area != null).map((d) => d.area);
                const nonMemberAreas = nonMembers.filter((d) => d.area != null).map((d) => d.area);
                const path = calculatePotentialOutline(potentialArea, memberAreas, edges, nonMemberAreas, (p) => p.containsElements(memberShapes), __classPrivateFieldGet(this, _BubbleSetPath_options, "f"));
                this.node.setAttribute('d', path.sample(8).simplify(0).bSplines().simplify(0).toString(2));
            };
            __classPrivateFieldSet(this, _BubbleSetPath_adapter, adapter, "f");
            __classPrivateFieldSet(this, _BubbleSetPath_options, {
                ...defaultOptions,
                style: {
                    stroke: 'black',
                    fill: 'black',
                    fillOpacity: '0.25',
                },
                className: '',
                throttle: 100,
                virtualEdges: false,
                interactive: false,
                includeLabels: false,
                includeMainLabels: false,
                includeOverlays: false,
                includeSourceLabels: false,
                includeTargetLabels: false,
                ...options,
            }, "f");
            Object.assign(this.node.style, __classPrivateFieldGet(this, _BubbleSetPath_options, "f").style);
            if (__classPrivateFieldGet(this, _BubbleSetPath_options, "f").className) {
                this.node.classList.add(__classPrivateFieldGet(this, _BubbleSetPath_options, "f").className);
            }
            if (__classPrivateFieldGet(this, _BubbleSetPath_options, "f").interactive) {
                this.node.addEventListener('dblclick', () => {
                    this.nodes.select();
                });
            }
            __classPrivateFieldSet(this, _BubbleSetPath_throttledUpdate, lodash_throttle(() => {
                this.update();
            }, __classPrivateFieldGet(this, _BubbleSetPath_options, "f").throttle), "f");
            __classPrivateFieldSet(this, _BubbleSetPath_adder, (e) => {
                e.target.on('add', __classPrivateFieldGet(this, _BubbleSetPath_adder, "f"));
                e.target.on('remove', __classPrivateFieldGet(this, _BubbleSetPath_remover, "f"));
                __classPrivateFieldGet(this, _BubbleSetPath_throttledUpdate, "f").call(this);
            }, "f");
            __classPrivateFieldSet(this, _BubbleSetPath_remover, (e) => {
                e.target.off('add', undefined, __classPrivateFieldGet(this, _BubbleSetPath_adder, "f"));
                e.target.off('remove', undefined, __classPrivateFieldGet(this, _BubbleSetPath_remover, "f"));
                __classPrivateFieldGet(this, _BubbleSetPath_throttledUpdate, "f").call(this);
            }, "f");
            nodes.on('position', __classPrivateFieldGet(this, _BubbleSetPath_throttledUpdate, "f"));
            nodes.on('add', __classPrivateFieldGet(this, _BubbleSetPath_adder, "f"));
            nodes.on('remove', __classPrivateFieldGet(this, _BubbleSetPath_remover, "f"));
            avoidNodes.on('position', __classPrivateFieldGet(this, _BubbleSetPath_throttledUpdate, "f"));
            avoidNodes.on('add', __classPrivateFieldGet(this, _BubbleSetPath_adder, "f"));
            avoidNodes.on('remove', __classPrivateFieldGet(this, _BubbleSetPath_remover, "f"));
            edges.on('move position', __classPrivateFieldGet(this, _BubbleSetPath_throttledUpdate, "f"));
            edges.on('add', __classPrivateFieldGet(this, _BubbleSetPath_adder, "f"));
            edges.on('remove', __classPrivateFieldGet(this, _BubbleSetPath_remover, "f"));
        }
        remove() {
            for (const set of [this.nodes, this.edges, this.avoidNodes]) {
                set.off('move position', undefined, __classPrivateFieldGet(this, _BubbleSetPath_throttledUpdate, "f"));
                set.off('add', undefined, __classPrivateFieldGet(this, _BubbleSetPath_adder, "f"));
                set.off('remove', undefined, __classPrivateFieldGet(this, _BubbleSetPath_remover, "f"));
                set.forEach((d) => {
                    d.scratch(SCRATCH_KEY, {});
                });
            }
            this.node.remove();
            return __classPrivateFieldGet(this, _BubbleSetPath_adapter, "f").remove(this);
        }
    }
    _BubbleSetPath_activeArea = new WeakMap(), _BubbleSetPath_potentialArea = new WeakMap(), _BubbleSetPath_options = new WeakMap(), _BubbleSetPath_virtualEdgeAreas = new WeakMap(), _BubbleSetPath_throttledUpdate = new WeakMap(), _BubbleSetPath_adder = new WeakMap(), _BubbleSetPath_remover = new WeakMap(), _BubbleSetPath_adapter = new WeakMap();

    var _BubbleSetsPlugin_layers, _BubbleSetsPlugin_adapter, _BubbleSetsPlugin_cy, _BubbleSetsPlugin_options;
    const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
    class BubbleSetsPlugin {
        constructor(currentCy, options = {}) {
            var _a;
            _BubbleSetsPlugin_layers.set(this, []);
            _BubbleSetsPlugin_adapter.set(this, {
                remove: (path) => {
                    const index = __classPrivateFieldGet(this, _BubbleSetsPlugin_layers, "f").indexOf(path);
                    if (index < 0) {
                        return false;
                    }
                    __classPrivateFieldGet(this, _BubbleSetsPlugin_layers, "f").splice(index, 1);
                    return true;
                },
            });
            _BubbleSetsPlugin_cy.set(this, void 0);
            _BubbleSetsPlugin_options.set(this, void 0);
            __classPrivateFieldSet(this, _BubbleSetsPlugin_cy, currentCy, "f");
            __classPrivateFieldSet(this, _BubbleSetsPlugin_options, options, "f");
            this.layer = (_a = options.layer) !== null && _a !== void 0 ? _a : cytoscapeLayers.layers(currentCy).nodeLayer.insertBefore('svg');
        }
        destroy() {
            for (const path of __classPrivateFieldGet(this, _BubbleSetsPlugin_layers, "f")) {
                path.remove();
            }
            this.layer.remove();
        }
        addPath(nodes, edges = __classPrivateFieldGet(this, _BubbleSetsPlugin_cy, "f").collection(), avoidNodes = __classPrivateFieldGet(this, _BubbleSetsPlugin_cy, "f").collection(), options = {}) {
            const node = this.layer.node.ownerDocument.createElementNS(SVG_NAMESPACE, 'path');
            this.layer.node.appendChild(node);
            const path = new BubbleSetPath(__classPrivateFieldGet(this, _BubbleSetsPlugin_adapter, "f"), node, nodes, edges !== null && edges !== void 0 ? edges : __classPrivateFieldGet(this, _BubbleSetsPlugin_cy, "f").collection(), avoidNodes !== null && avoidNodes !== void 0 ? avoidNodes : __classPrivateFieldGet(this, _BubbleSetsPlugin_cy, "f").collection(), { ...__classPrivateFieldGet(this, _BubbleSetsPlugin_options, "f"), ...options });
            __classPrivateFieldGet(this, _BubbleSetsPlugin_layers, "f").push(path);
            path.update();
            return path;
        }
        getPaths() {
            return __classPrivateFieldGet(this, _BubbleSetsPlugin_layers, "f").slice();
        }
        removePath(path) {
            const i = __classPrivateFieldGet(this, _BubbleSetsPlugin_layers, "f").indexOf(path);
            if (i < 0) {
                return false;
            }
            return path.remove();
        }
        update(forceUpdate = false) {
            __classPrivateFieldGet(this, _BubbleSetsPlugin_layers, "f").forEach((p) => p.update(forceUpdate));
        }
    }
    _BubbleSetsPlugin_layers = new WeakMap(), _BubbleSetsPlugin_adapter = new WeakMap(), _BubbleSetsPlugin_cy = new WeakMap(), _BubbleSetsPlugin_options = new WeakMap();
    function bubbleSets(options = {}) {
        return new BubbleSetsPlugin(this, options);
    }

    function register(cytoscape) {
        cytoscape('core', 'bubbleSets', bubbleSets);
    }
    function hasCytoscape(obj) {
        return typeof obj.cytoscape === 'function';
    }
    if (hasCytoscape(window)) {
        register(window.cytoscape);
    }

    exports.BubbleSetPath = BubbleSetPath;
    exports.BubbleSetsPlugin = BubbleSetsPlugin;
    exports.bubbleSets = bubbleSets;
    exports["default"] = register;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.umd.js.map
