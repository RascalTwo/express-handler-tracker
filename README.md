# Express Handler Tracker

> This project is ongoing Active development, I do not recommend reliance on it until this message is no longer here

Tracks activities your Express application does - middlewares, responses, etc - allowing you to visualize all of these events and changes in a network graph, for both debugging and architectural understanding.

> Despite being able to collect a large deal of information statically, this is not a static-analysis tool, views for example need to be evaluated in order to be rendered.

## Quickstart

```shell
$ npm install https://github.com/RascalTwo/expess-handler-tracker
$ npx https://github.com/RascalTwo/expess-handler-tracker instrument --port=1338
> ...
> Changes made
$ npm run start
> EHT available at http://localhost:1338/
```

## Installation

After installing the package:

```shell
npm install https://github.com/RascalTwo/expess-handler-tracker
```

Your Express application & any routers must be instrumented, actual application instrumentation only requires a single configurable: the entry point of your application.

This is the first file that dependency graphing should start from.

### Automatic Instrumentation

There exists a automatic-instrumentation & deinstrumentation script that will attempt to automate this process for you, it can be ran directly:

```shell
npx https://github.com/RascalTwo/expess-handler-tracker
```

It has all the options that can be manually crafted:

```shell
Commands:
  index.js instrument    Instrument code
  index.js deinstrument  Remove instrumentation from code

Options:
  --help                    Show help                                  [boolean]
  --version                 Show version number                        [boolean]
  --entryPoint              Where to start inspecting dependencies      [string]
  --port                    Port to start EHT server on                 [number]
  --diffExcludedProperties  Regexes of root properties to ignore when generating
                            request & response differences               [array]
  --subRoute                Route to expose EHT server in existing Express
                            Application                                 [string]
```

It will attempt to automatically detect a valid JavaScript file in the current working directory to use as an `entryPoint`, meaning that from your project directory you only need to execute

```shell
npx https://github.com/RascalTwo/expess-handler-tracker instrument
```

and approve each of the changes to get started!

### Manual Instrumentation

currently this must be done manually:

```javascript
const app = require('@rascal_two/express-handler-tracker')(express(), { entryPoint: 'index.js', port: 1234 })
const router = require('@rascal_two/express-handler-tracker')(express.Router());
```

This instrumentation method requires a single option:

```javascript
{
  entryPoint: 'filepath to the entry point JavaScript file',
}
```

Additionally there are optional properties that can be used:

```javascript
{
  port: 1234 // Port to start frontend server on, EHT server will not automatically start without,
  diffExcludedProperties: ['array', 'of', 'regular', 'expression', 'strings', 'of', 'root', 'properties', 'to', 'ignore']
  /*
  which defaults to [ '^__r2', '^client$', '^_readableState$', '^next$', '^req$', '^res$', '^socket$', '^host$', '^sessionStore$']
  */
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

## Troubleshooting

If you find requests take a long time, the most likely cause is that something large has been stringified during diffing, the solution is to wait for it to complete and then locate the middleware that has taken the longest time.

Then select it and manually inspect it to see which base property contains the most text.

Once located, adding this large property to your own `diffExcludedProperties` will resolve the issue.

### Usage

Visiting the EHT server will present you with a [Cytoscape](https://js.cytoscape.org/)-powered network graph representing your application code - staring from the provided `main: 'filename.js'` JavaScript file, with lines between nodes representing dependencies, and files in directories surrounded in those nodes.

If following the MVC architectural pattern you'll see some coloring by default.

#### API

If the EHT frontend is not your desire, all the raw information is accessible via the `/requests` and `/info` endpoints

- `/requests`
  - Information for each requests, has been serialized to JSON with [Flatted](https://github.com/WebReflection/flatted) to handle circular references, therefore needs to be parsed with the same library.
- `/info`
  - Dependency and view information.

#### Layouts

There are a few ways to customize and preserve layouts, first being the automatic generator, which while defaulted to `dagre-network`, allows for various user choices.

Next is the Grouping toggle, allowing switching between compound nodes to represent directories vs Bubblesets.

While these automatic-placements of nodes can be accurate, you are expected to customize the graph to your application, hence the inclusion of Export/Import and Save/Load buttons.

#### Request Playback

Any of the tracked requests can be selected from the dropdown, after which the first event will be rendered in the graph, and traversal through the events are possible via the next controls section.

Additionally there are two togglable modals, for `Request` and `Response` difference inspection - these modals will display the detected changes from the current middleware.

### How it works

Overriding all request-handler receiving methods - `.use`, `.get`, `.post`, etc - middlewares are tracked.

Manual overrides of common method such as `response.send`, `response.json`, `response.render`, `response.redirect`.

Discovery of dependencies via [dependency-cruiser](https://github.com/sverweij/dependency-cruise).

Routing override logic inspired by [`express-promise-router`](https://github.com/express-promise-router/express-promise-router).