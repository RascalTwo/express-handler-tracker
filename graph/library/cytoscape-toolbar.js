(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["cytoscapeToolbar"] = factory();
	else
		root["cytoscapeToolbar"] = factory();
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
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(module) {

var defaults = __webpack_require__(2);
var assign = __webpack_require__(1);

var data = {
	selectedTool: undefined,
	options: options,
	handlers: [],
	container: undefined
};

var cssOptions = {
	position: 'absolute',
	top: 0,
	left: 0,
	width: 0,
	height: 0,
	minWidth: 0,
	minHeight: 0,
	maxWidth: 0,
	maxHeight: 0,
	zIndex: options.zIndex
};

function initToolElement(tool, listIdx, toolIdx) {
	var padding = '';

	if (toolIdx != options.tools.length - 1) {
		if (options.position === 'top' || options.position === 'bottom') {
			padding = '10px 0 10px 10px';
		} else if (options.position === 'right' || options.position === 'left') {
			padding = '10px 10px 0 10px';
		}
	} else {
		padding = '10px';
	}

	var el = document.createElement('span');

	el.id = 'tool-' + listIdx + '-' + toolIdx;

	el.classList.add(options.toolItemClass + ' icon ' + tool.icon);

	el.style.cursor = 'pointer';
	el.style.color = '#aaa';
	el.style.width = '35px';
	el.style.height = '35px';
	el.style.fontSize = '24px';
	el.style.padding = padding;

	el.title = tool.tooltip;

	el['data-tool'] = listIdx + ',' + toolIdx;

	return el;
}

function bind(event, selector, action) {
	var index = data.handlers.push({
		events: event,
		selector: selector,
		action: action
	});

	var eventData = {
		data: data,
		handlerIndex: index - 1,
		canPerform: canPerform,
		getToolOptions: getToolOptions
	};

	if (selector === 'cy') {
		cy.bind(event, eventData, action);
	} else {
		cy.on(event, selector, eventData, action);
	}
}

function initTool(tool, toolListWrapper) {
	var _this = this;

	var toolElement = initToolElement(tool, listIdx, toolIdx);

	data.options.tools[listIdx][toolIdx].element = toolElement;

	var pressTimer = void 0,
	    startTime = void 0,
	    endTime = void 0;
	var toolItemLongHold = false;

	toolElement.onmousedown = function () {
		startTime = new Date().getTime();
		endTime = startTime;

		pressTimer = window.setTimeout(function () {
			if (startTime == endTime) {
				toolItemLongHold = true;
				toolListWrapper.css('overflow', 'visible');
			}
		}, options.longClickTime);
	};

	toolElement.onmouseup = function () {
		endTime = new Date().getTime();

		if (data.selectedTool != [toolListIndex, toolIndex] && !toolItemLongHold) {
			if (data.selectedTool != undefined) {
				data.options.tools[data.selectedTool[0]][data.selectedTool[1]].element.css('color', '#aaa');
			}
			data.selectedTool = [toolListIndex, toolIndex];
			$('.' + options.toolbarClass).find('.selected-tool').css('color', '#aaa').removeClass('selected-tool');
			$(_this).addClass('selected-tool').css('color', '#000');
		}
	};

	toolElement.mouseover = function () {
		hoveredTool = $(_this);
		hoveredTool.style.color = '#000';
	};

	toolElement.mouseout = function () {
		if (hoveredTool.classList.findIndex(function (value) {
			return value == 'selected-tool';
		}) > -1) {
			hoveredTool.style.color = '#000';
		} else {
			hoveredTool.style.color = '#aaa';
		}
	};

	window.onmouseup = function (e) {
		if (toolItemLongHold) {
			var moveLeft = 0;
			hoveredTool.parent().children().forEach(function (element) {
				if (hoveredTool.index() == index) {
					return false;
				}
				moveLeft += $(element).outerWidth(true);
			});

			var indexes = hoveredTool.attr('data-tool').split(',');
			data.selectedTool = indexes;
			var offsetLeft = 0 - moveLeft;
			$toolList.css('left', offsetLeft);
			$toolListWrapper.css('overflow', 'hidden');
			$('.' + options.toolbarClass).find('.selected-tool').removeClass('selected-tool');
			hoveredTool.addClass('selected-tool');
			clearTimeout(pressTimer);
			toolItemLongHold = false;
			startTime = -1;
			endTime = -1;
			return false;
		}
	};

	if (toolElement.event.length != toolElement.action.length) {
		var tooltip = toolElement.tooltip ? toolElement.tooltip : "<no tooltip>";
		console.log("Unequal lengths for event and action variables on " + index + "-" + tooltip);
	} else {
		for (var i = 0; i < toolElement.event.length; i++) {
			bind(toolElement.event[i], toolElement.selector, toolElement.action[i]);
		}
	}

	return toolElement;
}

function setPosition(position) {
	if (position === 'top') {
		cssOptions.top = $container.offset().top - 45;
		cssOptions.left = $container.offset().left;
		cssOptions.width = $container.outerWidth(true);
		cssOptions.minWidth = $container.outerWidth(true);
		cssOptions.maxWidth = $container.outerWidth(true);
	} else if (position === 'bottom') {
		cssOptions.top = $container.offset().top + $container.outerHeight(true);
		cssOptions.left = $container.offset().left;
		cssOptions.width = $container.outerWidth(true);
		cssOptions.minWidth = $container.outerWidth(true);
		cssOptions.maxWidth = $container.outerWidth(true);
	} else if (position === 'right') {
		cssOptions.top = $container.offset().top;
		cssOptions.left = $container.offset().left + $container.outerWidth(true) + 25;
		cssOptions.height = $container.outerHeight(true);
		cssOptions.minHeight = $container.outerHeight(true);
		cssOptions.maxHeight = $container.outerHeight(true);
	} else {
		// default - it is either 'left' or it is something we don't know so we use the default of 'left'
		cssOptions.top = $container.offset().top;
		cssOptions.left = $container.offset().left - 45;
		cssOptions.height = $container.outerHeight(true);
		cssOptions.minHeight = $container.outerHeight(true);
		cssOptions.maxHeight = $container.outerHeight(true);
	}
}

function createToolbarContainer(clazz) {
	var el = document.createElement('div');

	el.classList.add(clazz);

	setPosition(options.position);

	el.style.top = cssOptions.top;
	el.style.left = cssOptions.left;
	el.style.width = cssOptions.width + 'px';
	el.style.minWidth = cssOptions.minWidth + 'px';
	el.style.maxWidth = cssOptions.maxWidth + 'px';

	return el;
}

function initToolWrapperElement(clazz) {
	var el = document.createElement(div);

	el.classList.add(clazz);

	el.style.width = '45px';
	el.style.height = '45px';
	el.style.position = 'relative';
	el.style.overflow = 'hidden';
	el.style.float = 'left';
}

function createMoreArrow() {
	var el = document.createElement('span');

	el.classList.add('fa fa-caret-right');

	el.style.backgroundColor = 'transparent';
	el.style.position = 'absolute';
	el.style.top = 28;
	el.style.left = 35;
	el.style.zIndex = 9999;

	return el;
}

function initToolListElement(toolList, clazz) {
	var el = document.createElement('div');

	el.classList.add(clazz);

	el.style.position = 'absolute';
	el.style.width = toolList.length * 55 + 'px';
	el.style.height = '45px';
	el.style.backgroundColor = '#f9f9f9';

	return el;
}

function initToolList(toolList) {
	var toolWrapper = initToolWrapperElement(options.multipleToolsClass + '-wrapper');

	data.container.appendChild(toolWrapper);

	if (toolList.length > 1) {
		var moreArrow = createMoreArrow();

		toolWrapper.appendChild(moreArrow);
	}

	var toolListElement = initToolListElement(toolList, options.multipleToolsClass);

	toolWrapper.appendChild(toolListElement);

	toolList.forEach(function (tool) {
		var toolElement = initTool(tool, toolWrapper);

		toolList.appendChild(toolElement);
	});
}

function destroy() {
	// const data = $(this).data('cytoscapeToolbar');
	// const options = data.options;
	// const handlers = data.handlers;
	// const cy = data.cy;

	// // remove bound cy handlers
	// for (const i = 0; i < handlers.length; i++) {
	// 	const handler = handlers[i];
	// 	cy.off(handler.events, handler.selector, handler.fn);
	// }

	// // remove container from dom
	// data.$container.remove();
}

function canPerform(e, fn) {
	// if (!this.data.selectedTool) {
	// 	return false;
	// }

	// const toolIndexes = this.data.selectedTool;
	// const tool = this.data.options.tools[toolIndexes[0]][toolIndexes[1]];
	// const handlerIndex = this.handlerIndex;

	// if (!(toolIndexes === undefined) && $.inArray(fn, tool.action) > -1) {
	// 	const selector = this.data.handlers[handlerIndex].selector;

	// 	switch (selector) {
	// 		case 'node':
	// 			return e.cyTarget.isNode();
	// 		case 'edge':
	// 		    return e.cyTarget.isEdge();
	// 	    case 'node,edge':
	// 	    case 'edge,node':
	// 	        return e.cyTarget.isNode() || e.cyTarget.isEdge();
	// 		case 'cy':
	// 			return e.cyTarget == cy || tool.bubbleToCore;
	// 	}
	// }

	// return false;
}

function options(tool) {
	// const tool = this.data.options.tools[selectedTool[0]][selectedTool[1]];

	// return tool.options;
}

function init() {
	data.container = createToolbarContainer(options.toolbarClass);

	document.getElementById(options.container).appendChild(data.container);

	options.tools.forEach(function (toolList) {
		return initToolList(toolList);
	});
}

module.export = function (params) {
	var options = assign({}, defaults, params);
	var cy = this;
	var container = cy.container();
	var hoveredTool = void 0;

	if (options.tools || options.tools === undefined || options.tools.length < 1) {
		console.error('No tools are defined for cytoscape-toolbar.  Are you overriding tools accidently without defining new ones?');
	}

	console.debug("cytoscape-toolbar options:");
	console.debug(options);

	if (options.appendTools) {
		options.tools = defaults.tools.concat(options.tools);
	}

	$container.cytoscape(function (e) {
		cy = this;
		data.cy = cy;

		addEventListeners();

		$container.data('cytoscapeToolbar', data);
	});
};
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)(module)))

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// Simple, internal Object.assign() polyfill for options objects etc.

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
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var defaults = {
	cy: 'cy', // id being used for cytoscape core instance
	container: 'body',
	tools: [// an array of tools to list in the toolbar
	[{
		icon: 'fa fa-search-plus', // icon from font-awesome-4.0.3, if you want to use something else, then this becomes a class specific for this tool item
		event: ['tap'], // array of cytoscape events that correlates with action variable
		selector: 'cy', // cytoscape selector (cy = core instance, node, edge) - currently not supporting full selection selectors from the documentation
		options: {
			cy: {
				zoom: 0.1,
				minZoom: 0.1,
				maxZoom: 10,
				zoomDelay: 45
			}
		}, // pass through different parameters for separate selectors
		bubbleToCore: false, // say whether or not the event should be performed if the core instance was not clicked
		tooltip: 'Zoom In', // value for the title attribute of a span element
		action: [performZoomIn] // array of action methods that correlates with the event variable
	}], [{
		icon: 'fa fa-search-minus',
		event: ['tap'],
		selector: 'cy',
		options: {
			cy: {
				zoom: -0.1,
				minZoom: 0.1,
				maxZoom: 10,
				zoomDelay: 45
			}
		},
		bubbleToCore: false,
		tooltip: 'Zoom Out',
		action: [performZoomOut]
	}], [{
		icon: 'fa fa-arrow-right',
		event: ['tap'],
		selector: 'cy',
		options: {
			cy: {
				distance: -80
			}
		},
		bubbleToCore: true,
		tooltip: 'Pan Right',
		action: [performPanRight]
	}], [{
		icon: 'fa fa-arrow-down',
		event: ['tap'],
		selector: 'cy',
		options: {
			cy: {
				distance: -80
			}
		},
		bubbleToCore: true,
		tooltip: 'Pan Down',
		action: [performPanDown]
	}], [{
		icon: 'fa fa-arrow-left',
		event: ['tap'],
		selector: 'cy',
		options: {
			cy: {
				distance: 80
			}
		},
		bubbleToCore: true,
		tooltip: 'Pan Left',
		action: [performPanLeft]
	}], [{
		icon: 'fa fa-arrow-up',
		event: ['tap'],
		selector: 'cy',
		options: {
			cy: {
				distance: 80
			}
		},
		bubbleToCore: true,
		tooltip: 'Pan Up',
		action: [performPanUp]
	}]],
	appendTools: false, // set whether or not to append your custom tools list to the default tools list
	position: 'left', // set position of toolbar (right, left, up, down)
	toolbarClass: 'ui-cytoscape-toolbar', // set a class name for the toolbar to help with styling
	multipleToolsClass: 'tool-item-list', // set a class name for the tools that should be shown in the same position
	toolItemClass: 'tool-item', // set a class name for a toolbar item to help with styling
	autodisableForMobile: true, // disable the toolbar completely for mobile (since we don't really need it with gestures like pinch to zoom)
	zIndex: 9999, // the z-index of the ui div
	longClickTime: 325 // time until a multi-tool list will present other tools
};

function performZoomIn(e) {
	console.log("performing zoom in");
	performZoom(e, performZoomIn);
}

function performZoomOut(e) {
	console.log("performing zoom out");
	performZoom(e, performZoomOut);
}

function performZoom(e, action) {
	if (!e.data.canPerform(e, action)) {
		console.log("could not perform zoom");

		return;
	}

	var toolIndexes = e.data.data.selectedTool;
	var tool = e.data.data.options.tools[toolIndexes[0]][toolIndexes[1]];

	zoomGraph(e.cy, e.originalEvent.offsetX, e.originalEvent.offsetY, tool.options.cy);
}

function zoomGraph(core, x, y, factors) {
	console.log("zooming:");
	console.log({ x: x, y: y, factors: factors });

	var factor = 1 + factors.zoom;

	var zoom = core.zoom();

	var lvl = zoom * factor;

	if (lvl < factors.minZoom) {
		lvl = factors.minZoom;
	}

	if (lvl > factors.maxZoom) {
		lvl = factors.maxZoom;
	}

	if (lvl == factors.maxZoom && zoom == factors.maxZoom || lvl == factors.minZoom && zoom == factors.minZoom) {
		return;
	}

	zoomTo(core, x, y, lvl);
}

var zx, zy;
function zoomTo(core, x, y, level) {
	core.zoom({
		level: level,
		renderedPosition: { x: x, y: y }
	});
}
// end zooming

// panning
function performPanRight(e) {
	console.log("performing pan right");
	performPan(e, performPanRight, 0);
}

function performPanDown(e) {
	console.log("performing pan down");
	performPan(e, performPanDown, 1);
}

function performPanLeft(e) {
	console.log("performing pan left");
	performPan(e, performPanLeft, 2);
}

function performPanUp(e) {
	console.log("performing pan up");
	performPan(e, performPanUp, 3);
}

function performPan(e, action, direction) {
	if (!e.data.canPerform(e, action)) {
		console.log("could not perform pan");
		return;
	}

	console.log("performing pan");

	var toolIndexes = e.data.data.selectedTool;
	var tool = e.data.data.options.tools[toolIndexes[0]][toolIndexes[1]];

	pan(e.cy, direction, tool.options.cy);
}

function pan(core, direction, factors) {
	switch (direction) {
		case 0:
		case 2:
			core.panBy({ x: factors.distance, y: 0 });
			break;
		case 1:
		case 3:
			core.panBy({ x: 0, y: factors.distance });
			break;
	}
}

module.exports = defaults, performZoomIn, performZoomOut, performZoom, zoomGraph, zoomTo, performPanRight, performPanLeft, performPanUp, performPanDown;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var toolbar = __webpack_require__(0);

// registers the extension on a cytoscape lib ref
var register = function register(cytoscape) {
  if (!cytoscape) {
    return;
  } // can't register if cytoscape unspecified
	console.log(toolbar)
  cytoscape('core', 'toolbar', toolbar); // register with cytoscape.js
};

if (typeof cytoscape !== 'undefined') {
  // expose to global cytoscape (i.e. window.cytoscape)
  register(cytoscape);
}

module.exports = register;

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ })
/******/ ]);
});