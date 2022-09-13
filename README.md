# Express Handler Tracker

![GitHub package.json version](https://img.shields.io/github/package-json/v/RascalTwo/express-handler-tracker?style=for-the-badge)

> This project is ongoing Active development, I do not recommend reliance on it until this message is no longer here

Track the flow of requests through your application - then inspect them visually!

## Quickstart

```shell
$ npx https://github.com/RascalTwo/express-handler-tracker instrument --port=1338 --package
> ...
> Changes made
$ npm run start
> EHT available at http://localhost:1338/
```

> Used the `npx` command with this before? You may not get the most updated version - run with the `--version` flag and ensure it matches the latest version - if not you should remove it from the local package via `npm remove @rascal_two/express-handler-tracker` and then run `npx clear-npx-cache`

<details>
  <summary>Without NPX Usage</summary>

  ```shell
  $ npm install https://github.com/RascalTwo/express-handler-tracker
  $ node node_modules/.bin/express-handler-tracker instrument --port=1338
  > ...
  > Changes made
  $ npm run start
  > EHT available at http://localhost:1338/
  ```

</details>

> To use the latest possibly unstable features, add the `--replacers=all --attachAsyncProxiesToLatestRequest` flags to the instrument command.

## Table Of Contents

- [Express Handler Tracker](#express-handler-tracker)
	- [Quickstart](#quickstart)
	- [Table Of Contents](#table-of-contents)
	- [Installation](#installation)
		- [Automatic Instrumentation](#automatic-instrumentation)
		- [Manual Instrumentation](#manual-instrumentation)
			- [Proxy Instrumentation](#proxy-instrumentation)
	- [Troubleshooting](#troubleshooting)
	- [Usage](#usage)
		- [API](#api)
		- [Website](#website)
			- [Layouts](#layouts)
				- [Export/Import](#exportimport)
					- [SVG Generation](#svg-generation)
			- [Events](#events)
			- [Request](#request)
			- [Response](#response)
			- [Annotation](#annotation)
			- [Current Code](#current-code)
			- [All Code](#all-code)
	- [How it works](#how-it-works)

## Installation

After installing the package:

```shell
npm install https://github.com/RascalTwo/express-handler-tracker
```

Your Express application & any routers must be instrumented, actual application instrumentation only requires a single configurable: the entry point of your application.

This is the first file that dependency graphing should start from.

> In addition, anything that exists within the request lifecycle can be [Proxy Instrumented](#proxy-instrumentation).

### Automatic Instrumentation

There exists a automatic-instrumentation & deinstrumentation script that will attempt to automate this process for you, it can be ran directly:

```shell
npx https://github.com/RascalTwo/express-handler-tracker
```

It has all the options that can be manually crafted:

```shell
express-handler-tracker [command]

Commands:
  express-handler-tracker instrument    Instrument code
  express-handler-tracker deinstrument  Remove instrumentation from code

Options:
  --help                    Show help                                  [boolean]
  --version                 Show version number                        [boolean]
  --entryPoint              Where to start inspecting dependencies      [string]
  --port                    Port to start EHT server on                 [number]
  --diffExcludedProperties  Regexes of root properties to ignore when generating
                            request & response differences               [array]
  --subRoute                Route to expose EHT server in existing Express
                            Application                                 [string]
  --yesToAll                Approve of all changes without prompt      [boolean]
  --package                 Automatically install/remove package from project
                                                                       [boolean]
  --replacers               Replacers to process the code:
                            - server: Express Application
                            - router: Express Routers
                            - mongoose-model: Mongoose Models
                            - all: All replacers                         [array]
```

It will attempt to detect a valid JavaScript file in the current working directory to use as an `entryPoint`, meaning that from your project directory you only need to execute

```shell
npx https://github.com/RascalTwo/express-handler-tracker instrument
```

and approve each of the changes to get started!

> To automatically reverse the process you can use the `deinstrument` subcommand:

```shell
npx https://github.com/RascalTwo/express-handler-tracker deinstrument
```

### Manual Instrumentation

```javascript
const app = require('@rascal_two/express-handler-tracker')(express(), { entryPoint: 'index.js', port: 1234 })
const router = require('@rascal_two/express-handler-tracker')(express.Router());
```

Instrumentation requires a single option:

```javascript
{
  entryPoint: 'filepath to the entry point JavaScript file',
}
```

There do exist optional properties that can be used for customization:

```javascript
{
  port: 1234 // Port to start frontend server on, EHT server will not automatically start without,
  diffExcludedProperties: ['array', 'of', 'regular', 'expression', 'strings', 'of', 'root', 'properties', 'to', 'ignore'],
  /* defaults to [ '^__r2', '^client$', '^_readableState$', '^next$', '^req$', '^res$', '^socket$', '^host$', '^sessionStore$'] */
  attachAsyncProxiesToLatestRequest: true, // If proxy instrumented objects should attach to the latest request if their proper request could not be located
  ignoreRequests: {
    regexes: ['array', 'of', 'regular', 'expressions', 'that', 'will', 'ignore', 'matching', 'requests']
    // The string they will attempt to be matched against is the label of the request: method + ' ' + url,
    callbacks: [(request, response) => request.get('X-Header-Name') === 'condition to ignore request']
  }
}
```

You can instrument the main app, and on first run you'll receive errors indicating the detected routers that were not instrumented, allowing you to instrument a un-familiar application:

```shell
un-instrumented router found: /absolute/file/path/routers/filename.js
```

> If you wish to run the EHT server within your current Express app, that is also supported:

```javascript
const instrumentor = require('@rascal_two/express-handler-tracker')
let app = express();
app.use('/express-handler-tracker', instrumentor.server)
// Runs the EHT server under the `/express-handler-tracker` URL.
app = instrumentor(app, { entryPoint: 'index.js' })  // Port not included
```

> Note that you must use the returned value from the instrumentor, and anything done to the instance before will not be tracked:

```javascript
const app = express();
require('@rascal_two/express-handler-tracker')(app, { entryPoint: 'index.js' });
// Will not work
```

```javascript
let app = express();
app.use(middlewareFunction);
app = require('@rascal_two/express-handler-tracker')(app, { entryPoint: 'index.js' });
// Will not be able to track `middlewareFunction`
```

#### Proxy Instrumentation

It's possible to instrument any object that is in the request lifecycle - is accessed after a request has been made.

Take Mongoose Models for example:

```javascript
// Before
module.exports = mongoose.model('List', new mongoose.Schema({ ... }))
/// After
module.exports = require('@rascal_two/express-handler-tracker').proxyInstrument(mongoose.model('List', new mongoose.Schema({ ... })), 'List', {
  properties: ['find', 'updateOne', 'deleteOne']
});
```

The `proxyInstrument` method takes the object to be instrumented, the label of the object, and various options on how and what to instrument of the passed in object.

- `properties`
  - Properties to inspect normally
- `callbackMethods`
  - Methods of object to inspect that should have callbacks additionally inspected
  - Value is either the index of the callback in the argument list, or `true` to attempt to proxy all callback function arguments
- `allProperties`
  - Boolean to inspect all properties

> Due to the limitations of Node.js to access asynchronous call stacks, interactions with proxied objects from within promises & callbacks may not be accurately reported
> The `attachAsyncProxiesToLatestRequest` was added to make these usable by attaching them to the latest request, which will be accurate as long as the server receives requests sequentially.

## Troubleshooting

If you find requests take a long time, the most likely cause is that something large has been stringified during calculating the changes a event has made, the solution is to wait for it to complete and then locate the middleware that has taken the longest time.

Then select it and manually inspect it to see which base property contains the most text.

Once located, adding this large property to your own `diffExcludedProperties` will resolve the issue.

## Usage

Visiting the EHT server will present you with a [Cytoscape](https://js.cytoscape.org/)-powered network graph representing your application code - staring from the provided `main: 'filename.js'` JavaScript file, with lines between nodes representing dependencies, and files in directories surrounded in those nodes.

If following the MVC architectural pattern you'll see some coloring by default.

### API

If the EHT frontend is not your desire, all the raw information is accessible via the `/requests` and `/info` endpoints

- `/requests`
  - Information for each requests, has been serialized to JSON with [Flatted](https://github.com/WebReflection/flatted) to handle circular references, therefore needs to be parsed with the same library.
- `/info`
  - Dependency and view information.

### Website

The first feature of the website is that - unless something unexpected happens - you never need to refresh the page to receive new events, they are streamed from the EHT server.

***

You'll first be presented with a graph of various nodes with edges between them, some grouped together in compound nodes.

This is the primary view, showing you every file and directory in the project, allowing you to manually move the nodes around as you desire.

Each of these nodes can be clicked to open the file up in Visual Studio Code

***

The bar at the bottom contains all the possible windows, of which all can be moved, resized and maximized/minimized.

#### Layouts

Settings for how the nodes are layed out on the page and rendered.

- Groups/Bubbles
  - If to group directories into compound nodes or not.
- Edges
  - To show all edges or only edges for the current request
- Event Numbers
  - Mark nodes & edges of the current request sequentially
- Nodes
  - Display all nodes or just the ones of the current request
- Theme
  - Dark/Light Theme
- Request Highlights
  - Outline current request edges/nodes
- Code Tooltips
  - Show tooltip of code on every node for the current request

Additionally there are style rules, which determine the color and shape of all nodes on the page.

The pattern can be inputted any valid Regular Expression for nodes to match - this will be ran on the filename - in addition to the color and shape to make matching nodes.

##### Export/Import

All data can be Exported & Imported to various formats - straight to the clipboard, downloaded as a `.json` file, or saved to local storage.

You can filter what data is exported - from window positions, node rendering information, style rules, and each individual request.

Additionally you can modify the paths - root, views, and views extension - allowing you to prefix all URLs with a non-local resource, such as a GitHub repository.

Finally you can also generate SVG/PNG images of the current layout.

###### SVG Generation

The generated SVGs additionally have all the nodes linked - based on the entered root.

This can allow for staticly clickable versions of this to be hosted, and linked to from a GitHub repository README.md for example.

#### Events

The Events windows allows one to see all the requests that have come in, the events associated for each, and the ability to navigate through all of them one by one - which updates the contents of other windows appropriately.

Events that have been indented with hyphens are detected as sub-events, for example events that occurred within a unique Express Router.

> Proxy Events seen with a trailing `*` were added via `attachAsyncProxiesToLatestRequest`, meaning there is a chance they don't belong to this request.

&nbsp;

> The Event toast that appears within the graph contains all known links for the event in question - from where it was added to the application, where it was evaluated, router construction, etc - all clickable to open the file to that location in Visual Studio Code

#### Request

Shows the changes to the request due to the currently selected event.

> Additionally shows other input-related data, such as proxied arguments

#### Response

Shows the changes to the request due to the currently selected event - additionally shows data passed to view rendering, sent data, proxies return values.

#### Annotation

Shows and allows the user to edit the markdown-powered annotation for the current event.

Additionally, by adding content within

```markdown
[//]: # (Start Annotation)

[//]: # (End Annotation)
```

blocks, it will place this markdown in the tooltip for the event.

#### Current Code

The current code for the selected middleware

#### All Code

All of the code for the current request, with render buttons to render straight to that event in question.

## How it works

Overriding all request-handler receiving methods - `.use`, `.get`, `.post`, etc - middlewares are tracked.

Manual overrides of common method such as `response.send`, `response.json`, `response.render`, `response.redirect`.

Discovery of dependencies via [dependency-cruiser](https://github.com/sverweij/dependency-cruise).

Routing override logic inspired by [`express-promise-router`](https://github.com/express-promise-router/express-promise-router).

Cloning done via [`@ungap/structured-clone`](https://github.com/ungap/structured-clone).
