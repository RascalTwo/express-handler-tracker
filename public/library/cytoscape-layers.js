/**
 * cytoscape-layers
 * https://github.com/sgratzl/cytoscape.js-layers
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.CytoscapeLayers = {}));
})(this, (function (exports) { 'use strict';

    const layerStyle = {
        position: 'absolute',
        left: '0',
        top: '0',
        userSelect: 'none',
        outlineStyle: 'none',
        width: '100%',
        height: '100%',
    };
    function stop(e) {
        e.stopPropagation();
    }
    function stopClicks(node) {
        node.addEventListener('click', stop);
        node.addEventListener('mousedown', stop);
        node.addEventListener('mouseup', stop);
        node.addEventListener('mousemove', stop);
    }

    class ABaseLayer {
        constructor(adapter) {
            this.adapter = adapter;
            this.updateOnRenderEnabled = false;
        }
        inVisibleBounds(p) {
            return this.adapter.inVisibleBounds(p);
        }
        get updateOnRender() {
            return this.updateOnRenderEnabled;
        }
        set updateOnRender(value) {
            if (this.updateOnRenderEnabled === value) {
                return;
            }
            this.updateOnRenderEnabled = value;
            if (value) {
                this.cy.on('render', this.update);
            }
            else {
                this.cy.off('render', this.update);
            }
        }
        get cy() {
            return this.adapter.cy;
        }
        moveUp() {
            this.adapter.move(this, -1);
        }
        moveDown() {
            this.adapter.move(this, 1);
        }
        moveBack() {
            this.adapter.move(this, Number.NEGATIVE_INFINITY);
        }
        moveFront() {
            this.adapter.move(this, Number.POSITIVE_INFINITY);
        }
        insertBefore(type, options) {
            return this.adapter.insert('before', this, type, options);
        }
        insertAfter(type, options) {
            return this.adapter.insert('after', this, type, options);
        }
    }

    class ADOMBaseLayer extends ABaseLayer {
        constructor(adapter, root) {
            super(adapter);
            this.callbacks = [];
            this.update = () => {
                for (const o of this.callbacks) {
                    o(this.node);
                }
            };
            this.root = root;
            Object.assign(this.root.style, layerStyle);
        }
        get visible() {
            return this.root.style.display !== 'none';
        }
        set visible(value) {
            if (this.visible === value) {
                return;
            }
            this.root.style.display = value ? '' : 'none';
        }
        show() {
            this.visible = true;
        }
        hide() {
            this.visible = false;
        }
        callback(callback) {
            this.callbacks.push(callback);
            this.update();
            return this;
        }
        resize() {
        }
        remove() {
            this.root.remove();
        }
    }

    const SVG_NS = 'http://www.w3.org/2000/svg';
    class SVGLayer extends ADOMBaseLayer {
        constructor(adapter, doc, options = {}) {
            super(adapter, doc.createElementNS(SVG_NS, 'svg'));
            this.type = 'svg';
            this.updateOnTransform = false;
            this.root.__cy_layer = this;
            this.node = doc.createElementNS(SVG_NS, 'g');
            this.node.__cy_layer = this;
            this.root.appendChild(this.node);
            if (options.stopClicks) {
                stopClicks(this.node);
            }
        }
        setViewport(tx, ty, zoom) {
            this.node.setAttribute('transform', `translate(${tx},${ty})scale(${zoom})`);
            if (this.updateOnTransform) {
                this.update();
            }
        }
    }
    class SVGStaticLayer extends ADOMBaseLayer {
        constructor(adapter, doc, options = {}) {
            super(adapter, doc.createElementNS(SVG_NS, 'svg'));
            this.type = 'svg-static';
            this.root.__cy_layer = this;
            this.node = doc.createElementNS(SVG_NS, 'g');
            this.node.__cy_layer = this;
            this.root.appendChild(this.node);
            if (options.stopClicks) {
                stopClicks(this.node);
            }
        }
        setViewport() {
        }
    }

    class CanvasBaseLayer extends ABaseLayer {
        constructor(adapter, doc, options = {}) {
            var _a, _b;
            super(adapter);
            this.callbacks = [];
            this.transform = {
                tx: 0,
                ty: 0,
                zoom: 1,
            };
            this.update = () => this.draw();
            this.node = doc.createElement('canvas');
            Object.assign(this.node.style, layerStyle);
            if (options.stopClicks) {
                stopClicks(this.node);
            }
            this.pixelRatio = (_b = (_a = options.pixelRatio) !== null && _a !== void 0 ? _a : (window !== null && window !== void 0 ? window : {}).devicePixelRatio) !== null && _b !== void 0 ? _b : 1;
            this.ctx = this.node.getContext('2d', options);
            this.ctx.resetTransform();
        }
        get visible() {
            return this.node.style.display !== 'none';
        }
        set visible(value) {
            this.node.style.display = value ? '' : 'none';
        }
        show() {
            this.visible = true;
        }
        hide() {
            this.visible = false;
        }
        get root() {
            return this.node;
        }
        callback(callback) {
            this.callbacks.push(callback);
            this.update();
            return this;
        }
        clear() {
            const ctx = this.ctx;
            const bak = ctx.getTransform();
            ctx.resetTransform();
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.setTransform(bak);
        }
        draw() {
            this.clear();
            this.ctx.save();
            this.ctx.resetTransform();
            this.ctx.scale(this.pixelRatio, this.pixelRatio);
            this.ctx.translate(this.transform.tx, this.transform.ty);
            this.ctx.scale(this.transform.zoom, this.transform.zoom);
            for (const r of this.callbacks) {
                r(this.ctx);
            }
            this.ctx.restore();
        }
        resize(width, height) {
            this.node.width = width * this.pixelRatio;
            this.node.height = height * this.pixelRatio;
            this.update();
        }
        setViewport(_tx, _ty, _zoom) {
        }
        remove() {
            this.node.remove();
        }
    }
    class CanvasLayer extends CanvasBaseLayer {
        constructor(adapter, doc, options = {}) {
            super(adapter, doc, options);
            this.type = 'canvas';
            this.node.__cy_layer = this;
        }
        setViewport(tx, ty, zoom) {
            this.transform.tx = tx;
            this.transform.ty = ty;
            this.transform.zoom = zoom;
            this.update();
        }
    }
    class CanvasStaticLayer extends CanvasBaseLayer {
        constructor(adapter, doc, options = {}) {
            super(adapter, doc, options);
            this.type = 'canvas-static';
            this.node.__cy_layer = this;
        }
    }

    class HTMLLayer extends ADOMBaseLayer {
        constructor(adapter, doc, options = {}) {
            super(adapter, doc.createElement('div'));
            this.type = 'html';
            this.updateOnTransform = false;
            this.root.__cy_layer = this;
            this.node = doc.createElement('div');
            this.node.__cy_layer = this;
            this.node.style.position = 'absolute';
            this.node.style.left = '0px';
            this.node.style.top = '0px';
            this.root.appendChild(this.node);
            if (options.stopClicks) {
                stopClicks(this.node);
            }
        }
        setViewport(tx, ty, zoom) {
            this.node.style.transform = `translate(${tx}px,${ty}px)scale(${zoom})`;
            if (this.updateOnTransform) {
                this.update();
            }
        }
    }
    class HTMLStaticLayer extends ADOMBaseLayer {
        constructor(adapter, doc, options = {}) {
            super(adapter, doc.createElement('div'));
            this.type = 'html-static';
            this.node.__cy_layer = this;
            if (options.stopClicks) {
                stopClicks(this.node);
            }
        }
        get node() {
            return this.root;
        }
        setViewport() {
        }
    }

    class CytoscapeBaseLayer extends ABaseLayer {
        constructor(adapter, node) {
            super(adapter);
            this.update = () => {
            };
            this.node = node;
        }
        get root() {
            return this.node;
        }
        resize() {
        }
        setViewport() {
        }
        remove() {
        }
    }
    class CytoscapeNodeLayer extends CytoscapeBaseLayer {
        constructor(adapter, node) {
            super(adapter, node);
            this.type = 'node';
            this.node.__cy_layer = this;
        }
    }
    class CytoscapeDragLayer extends CytoscapeBaseLayer {
        constructor(adapter, node) {
            super(adapter, node);
            this.type = 'drag';
            this.node.__cy_layer = this;
        }
    }
    class CytoscapeSelectBoxLayer extends CytoscapeBaseLayer {
        constructor(adapter, node) {
            super(adapter, node);
            this.type = 'select-box';
            this.node.__cy_layer = this;
        }
    }

    function matchNodes(root, nodes, options) {
        const arr = Array.from(root.children);
        if (!options.uniqueElements) {
            nodes.forEach((node) => {
                const bb = options.bb(node);
                if (!options.isVisible(bb)) {
                    return;
                }
                if (arr.length > 0) {
                    options.update(arr.shift(), node, bb);
                }
                else {
                    const elem = options.enter(node, bb);
                    root.appendChild(elem);
                    options.update(elem, node, bb);
                }
            });
            for (const rest of arr) {
                rest.remove();
            }
            return;
        }
        const map = new Map(arr.map((d) => [d.dataset.id, d]));
        let i = -1;
        nodes.forEach((node) => {
            const bb = options.bb(node);
            if (!options.isVisible(bb)) {
                return;
            }
            i++;
            const id = node.id();
            const expected = arr[i];
            const has = map.get(id);
            let n;
            if (has) {
                options.update(has, node, bb);
                map.delete(id);
                if (expected === has) {
                    return;
                }
                n = has;
            }
            else {
                n = options.enter(node, bb);
                n.dataset.id = id;
                options.update(n, node, bb);
            }
            if (i === 0) {
                root.insertAdjacentElement('afterbegin', n);
            }
            else {
                arr[i - 1].insertAdjacentElement('afterend', n);
            }
            arr.splice(i, 0, n);
        });
        map.forEach((n) => n.remove());
    }
    function registerCallback(layer, renderer) {
        layer.callback(renderer);
        return {
            remove: () => {
                layer.callbacks.splice(layer.callbacks.indexOf(renderer), 1);
            },
        };
    }

    function defaultElementLayerOptions(o) {
        return {
            selector: ':visible',
            updateOn: o != null && o.queryEachTime ? 'render' : 'position',
            queryEachTime: false,
            checkBounds: true,
        };
    }

    function renderPerEdge(layer, render, options) {
        const o = Object.assign({
            checkBoundsPointCount: 5,
            initCollection: () => undefined,
        }, defaultElementLayerOptions(options), options);
        const edges = o.queryEachTime ? layer.cy.collection() : layer.cy.edges(o.selector);
        if (!o.queryEachTime) {
            o.initCollection(edges);
        }
        if (o.updateOn === 'render') {
            layer.updateOnRender = true;
        }
        else if (o.updateOn === 'position') {
            edges.on('position add remove', layer.update);
            edges.sources().on('position', layer.update);
            edges.targets().on('position', layer.update);
        }
        else {
            edges.on('add remove', layer.update);
        }
        const renderer = (ctx) => {
            const currentEdges = o.queryEachTime ? layer.cy.edges(o.selector) : edges;
            if (o.queryEachTime) {
                o.initCollection(currentEdges);
            }
            currentEdges.forEach((edge) => {
                const impl = edge._private.rscratch;
                const s = impl && impl.startX != null && impl.startY != null ? { x: impl.startX, y: impl.startY } : edge.sourceEndpoint();
                const t = impl && impl.endX != null && impl.endY != null ? { x: impl.endX, y: impl.endY } : edge.targetEndpoint();
                if (o.checkBounds && o.checkBoundsPointCount > 0 && !anyVisible(layer, s, t, o.checkBoundsPointCount)) {
                    return;
                }
                if (impl && impl.pathCache) {
                    render(ctx, edge, impl.pathCache, s, t);
                    return;
                }
                const path = new Path2D();
                path.moveTo(s.x, s.y);
                path.lineTo(t.x, t.y);
                render(ctx, edge, path, s, t);
            });
        };
        const r = registerCallback(layer, renderer);
        return {
            layer,
            edges,
            remove: () => {
                edges.off('position add remove', undefined, layer.update);
                edges.sources().off('position', undefined, layer.update);
                edges.targets().off('position', undefined, layer.update);
                r.remove();
            },
        };
    }
    function anyVisible(layer, s, t, count) {
        const interpolate = (v) => ({
            x: s.x * v + t.x * (1 - v),
            y: s.y * v + t.y * (1 - v),
        });
        if (count === 1) {
            return layer.inVisibleBounds(interpolate(0.5));
        }
        const step = 1 / count;
        for (let i = 0; i <= count; i++) {
            if (layer.inVisibleBounds(interpolate(i * step))) {
                return true;
            }
        }
        return false;
    }

    function renderPerNode(layer, render, options = {}) {
        const o = Object.assign({
            transform: '',
            position: 'top-left',
            boundingBox: {
                includeLabels: false,
                includeOverlays: false,
            },
            uniqueElements: false,
            initCollection: () => undefined,
        }, defaultElementLayerOptions(options), options);
        const nodes = o.queryEachTime ? layer.cy.collection() : layer.cy.nodes(o.selector);
        if (!o.queryEachTime) {
            o.initCollection(nodes);
        }
        if (o.updateOn === 'render') {
            layer.updateOnRender = true;
        }
        else if (o.updateOn === 'position') {
            nodes.on('position add remove', layer.update);
        }
        else {
            nodes.on('add remove', layer.update);
        }
        const wrapResult = (v) => ({
            layer,
            nodes,
            remove: () => {
                nodes.off('position add remove', undefined, layer.update);
                v.remove();
            },
        });
        if (layer.type === 'canvas') {
            const oCanvas = o;
            const renderer = (ctx) => {
                const t = ctx.getTransform();
                const currentNodes = oCanvas.queryEachTime ? layer.cy.nodes(oCanvas.selector) : nodes;
                if (o.queryEachTime) {
                    o.initCollection(currentNodes);
                }
                currentNodes.forEach((node) => {
                    const bb = node.boundingBox(o.boundingBox);
                    if (oCanvas.checkBounds && !layer.inVisibleBounds(bb)) {
                        return;
                    }
                    if (oCanvas.position === 'top-left') {
                        ctx.translate(bb.x1, bb.y1);
                    }
                    else if (oCanvas.position === 'center') {
                        const pos = node.position();
                        ctx.translate(pos.x, pos.y);
                    }
                    render(ctx, node, bb);
                    if (oCanvas.position !== 'none') {
                        ctx.setTransform(t);
                    }
                });
            };
            return wrapResult(registerCallback(layer, renderer));
        }
        const oDOM = o;
        const baseOptions = {
            bb: (node) => node.boundingBox(oDOM.boundingBox),
            isVisible: oDOM.checkBounds ? (bb) => layer.inVisibleBounds(bb) : () => true,
            uniqueElements: oDOM.uniqueElements === true,
        };
        if (oDOM.checkBounds) {
            layer.updateOnTransform = true;
        }
        if (layer.type === 'html') {
            const matchOptions = {
                ...baseOptions,
                enter: (node, bb) => {
                    const r = layer.node.ownerDocument.createElement('div');
                    r.style.position = 'absolute';
                    if (oDOM.init) {
                        oDOM.init(r, node, bb);
                    }
                    return r;
                },
                update: (elem, node, bb) => {
                    if (oDOM.position === 'top-left') {
                        elem.style.transform = `${oDOM.transform}translate(${bb.x1}px,${bb.y1}px)`;
                    }
                    else if (oDOM.position === 'center') {
                        const pos = node.position();
                        elem.style.transform = `${oDOM.transform}translate(${pos.x}px,${pos.y}px)`;
                    }
                    render(elem, node, bb);
                },
            };
            const renderer = (root) => {
                const currentNodes = oDOM.queryEachTime ? layer.cy.nodes(oDOM.selector) : nodes;
                if (o.queryEachTime) {
                    o.initCollection(currentNodes);
                }
                matchNodes(root, currentNodes, matchOptions);
            };
            return wrapResult(registerCallback(layer, renderer));
        }
        const matchOptions = {
            ...baseOptions,
            enter: (node, bb) => {
                const r = layer.node.ownerDocument.createElementNS(SVG_NS, 'g');
                if (oDOM.init) {
                    oDOM.init(r, node, bb);
                }
                return r;
            },
            update: (elem, node, bb) => {
                if (oDOM.position === 'top-left') {
                    elem.setAttribute('transform', `${oDOM.transform}translate(${bb.x1},${bb.y1})`);
                }
                else if (oDOM.position === 'center') {
                    const pos = node.position();
                    elem.setAttribute('transform', `${oDOM.transform}translate(${pos.x},${pos.y})`);
                }
                render(elem, node, bb);
            },
        };
        const renderer = (root) => {
            const currentNodes = oDOM.queryEachTime ? layer.cy.nodes(oDOM.selector) : nodes;
            if (o.queryEachTime) {
                o.initCollection(currentNodes);
            }
            matchNodes(root, currentNodes, matchOptions);
        };
        return wrapResult(registerCallback(layer, renderer));
    }

    function isPoint(p) {
        return p.x != null;
    }
    class LayersPlugin {
        constructor(cy) {
            this.resize = () => {
                const width = this.cy.width();
                const height = this.cy.height();
                this.viewport.width = width;
                this.viewport.height = height;
                for (const layer of this.layers) {
                    layer.resize(width, height);
                }
            };
            this.destroy = () => {
                for (const layer of this.layers) {
                    layer.remove();
                }
                this.cy.off('destroy', this.destroy);
                this.cy.off('viewport', this.zoomed);
                this.cy.off('resize', this.resize);
                this.cy.scratch('_layers', undefined);
            };
            this.zoomed = () => {
                const pan = this.cy.pan();
                const zoom = this.cy.zoom();
                this.viewport.tx = pan.x;
                this.viewport.ty = pan.y;
                this.viewport.zoom = zoom;
                for (const layer of this.layers) {
                    layer.setViewport(pan.x, pan.y, zoom);
                }
            };
            this.renderPerEdge = renderPerEdge;
            this.renderPerNode = renderPerNode;
            this.cy = cy;
            this.adapter = {
                cy: this.cy,
                insert: (where, layer, type) => this.insert(where, layer, type),
                move: (layer, offset) => this.move(layer, offset),
                inVisibleBounds: (p) => {
                    const v = this.viewport;
                    const inX = (x) => {
                        const xp = x * v.zoom + v.tx;
                        return xp >= 0 && xp <= v.width;
                    };
                    const inY = (y) => {
                        const yp = y * v.zoom + v.ty;
                        return yp >= 0 && yp <= v.height;
                    };
                    if (isPoint(p)) {
                        return inX(p.x) && inY(p.y);
                    }
                    return ((inX(p.x1) && inY(p.y1)) ||
                        (inX(p.x2) && inY(p.y1)) ||
                        (inX(p.x2) && inY(p.y2)) ||
                        (inX(p.x1) && inY(p.y2)) ||
                        (inX((p.x1 + p.x2) / 2) && inY((p.y1 + p.y2) / 2)));
                },
            };
            const container = cy.container();
            const nodeLayer = new CytoscapeNodeLayer(this.adapter, container.querySelector('[data-id="layer2-node"]'));
            this.nodeLayer = nodeLayer;
            const dragLayer = new CytoscapeDragLayer(this.adapter, container.querySelector('[data-id="layer1-drag"]'));
            this.dragLayer = dragLayer;
            const selectBoxLayer = new CytoscapeSelectBoxLayer(this.adapter, container.querySelector('[data-id="layer0-selectbox"]'));
            this.selectBoxLayer = selectBoxLayer;
            nodeLayer.root.style.zIndex = '';
            dragLayer.root.style.zIndex = '';
            selectBoxLayer.root.style.zIndex = '';
            nodeLayer.root.insertAdjacentElement('afterend', dragLayer.root);
            dragLayer.root.insertAdjacentElement('afterend', selectBoxLayer.root);
            cy.on('viewport', this.zoomed);
            cy.on('resize', this.resize);
            cy.on('destroy', this.destroy);
            this.viewport = {
                width: this.cy.width(),
                height: this.cy.height(),
                tx: this.cy.pan().x,
                ty: this.cy.pan().y,
                zoom: this.cy.zoom(),
            };
        }
        move(layer, offset) {
            const l = this.layers;
            const index = l.indexOf(layer);
            const target = Math.max(Math.min(index + offset, l.length, 0));
            if (target === index) {
                return;
            }
            if (index >= l.length - 1) {
                this.root.appendChild(layer.root);
            }
            else {
                this.root.insertBefore(layer.root, l[target].root);
            }
        }
        get document() {
            return this.cy.container().ownerDocument;
        }
        get root() {
            return this.nodeLayer.node.parentElement;
        }
        get layers() {
            return Array.from(this.root.children)
                .map((d) => d.__cy_layer)
                .filter((d) => d != null);
        }
        getLayers() {
            return this.layers;
        }
        init(layer) {
            layer.resize(this.viewport.width, this.viewport.height);
            layer.setViewport(this.viewport.tx, this.viewport.ty, this.viewport.zoom);
            return layer;
        }
        update() {
            this.zoomed();
            for (const layer of this.layers) {
                if (layer instanceof CanvasLayer) {
                    layer.draw();
                }
            }
        }
        createLayer(type, options) {
            switch (type) {
                case 'svg':
                    return this.init(new SVGLayer(this.adapter, this.document, options));
                case 'html':
                    return this.init(new HTMLLayer(this.adapter, this.document, options));
                case 'canvas':
                    return this.init(new CanvasLayer(this.adapter, this.document, options));
                case 'html-static':
                    return this.init(new HTMLStaticLayer(this.adapter, this.document, options));
                case 'svg-static':
                    return this.init(new SVGStaticLayer(this.adapter, this.document, options));
                case 'canvas-static':
                    return this.init(new CanvasStaticLayer(this.adapter, this.document, options));
            }
        }
        append(type, options) {
            const layer = this.createLayer(type, options);
            this.root.appendChild(layer.root);
            return layer;
        }
        insert(where, ref, type, options) {
            const layer = this.createLayer(type, options);
            ref.root.insertAdjacentElement(where === 'before' ? 'beforebegin' : 'afterend', layer.root);
            return layer;
        }
        getLast() {
            var _a;
            const layers = this.layers;
            return (_a = layers[layers.length - 1]) !== null && _a !== void 0 ? _a : null;
        }
        getFirst() {
            var _a;
            const layers = this.layers;
            return (_a = layers[0]) !== null && _a !== void 0 ? _a : null;
        }
    }
    function layers(cy = this) {
        if (!cy.container()) {
            throw new Error('layers plugin does not work in headless environments');
        }
        const singleton = cy.scratch('_layers');
        if (singleton) {
            return singleton;
        }
        const plugin = new LayersPlugin(cy);
        cy.scratch('_layers', plugin);
        return plugin;
    }

    function register(cytoscape) {
        cytoscape('core', 'layers', layers);
    }
    if (typeof window.cytoscape !== 'undefined') {
        register(window.cytoscape);
    }

    exports.LayersPlugin = LayersPlugin;
    exports["default"] = register;
    exports.layers = layers;
    exports.renderPerEdge = renderPerEdge;
    exports.renderPerNode = renderPerNode;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
