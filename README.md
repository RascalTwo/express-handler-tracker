# Express Handler Tracker

> This project is ongoing Active development, I do not recommend reliance on it until this message is no longer here

Tracks activities your Express application does - middlewares, responses, etc - allowing you to visualize all of these events and changes in a network graph, for both debugging and architectural understanding.

## Quickstart

```shell
$ npx https://github.com/RascalTwo/expess-handler-tracker instrument --port=1338 --package
> ...
> Changes made
$ npm run start
> EHT available at http://localhost:1338/
```

<details>
  <summary>Without NPX Usage</summary>

  ```shell
  $ npm install https://github.com/RascalTwo/expess-handler-tracker
  $ node node_modules/.bin/express-handler-tracker instrument --port=1338
  > ...
  > Changes made
  $ npm run start
  > EHT available at http://localhost:1338/
  ```

</details>

## Installation

After installing the package:

```shell
npm install https://github.com/RascalTwo/expess-handler-tracker
```

Your Express application & any routers must be instrumented, actual application instrumentation only requires a single configurable: the entry point of your application.

This is the first file that dependency graphing should start from.

> In addition, anything that exists within the request lifecycle can me [Proxy Instrumented](#express-handler-tracker).

### Automatic Instrumentation

There exists a automatic-instrumentation & deinstrumentation script that will attempt to automate this process for you, it can be ran directly:

```shell
npx https://github.com/RascalTwo/expess-handler-tracker
```

It has all the options that can be manually crafted:

```shell
instrument.js [command]

Commands:
  instrument.js instrument    Instrument code
  instrument.js deinstrument  Remove instrumentation from code

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
```

It will attempt to detect a valid JavaScript file in the current working directory to use as an `entryPoint`, meaning that from your project directory you only need to execute

```shell
npx https://github.com/RascalTwo/expess-handler-tracker instrument
```

and approve each of the changes to get started!

> To automatically reverse the process you can use the `deinstrument` subcommand:

```shell
npx https://github.com/RascalTwo/expess-handler-tracker deinstrument
```

### Manual Instrumentation

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

There do exist optional properties that can be used for customization:

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

#### Proxy Instrumentation

It's possible to instrument any object that is in the request lifecycle - is accessed after a request has been made.

Take Mongoose Models for example:

```javascript
// Before
module.exports = mongoose.model('List', new mongoose.Schema({ ... }))
/// After
module.exports = require('@rascal_two/express-handler-tracker').proxyInstrument(mongoose.model('List', new mongoose.Schema({ ... })), 'List', ['find', 'updateOne', 'deleteOne']);
```

The `proxyInstrument` method takes the object to be instrumented, the label of the object, and all properties of the object to be instrumented - if an empty array is passed, then every property will be instrumented.

## Troubleshooting

If you find requests take a long time, the most likely cause is that something large has been stringified during calculating the changes a event has made, the solution is to wait for it to complete and then locate the middleware that has taken the longest time.

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

#### Website

The first feature of the website is that - unless something unexpected happens - you never need to refresh the page to receive new events, they are streamed from the EHT server.

***

You'll first be presented with a graph of various nodes with edges between them, some grouped together in compound nodes.

This is the primary view, showing you every file and directory in the project, allowing you to manually move the nodes around as you desire.

Each of these nodes can be clicked to open the file up in Visual Studio Code

***

The bar at the bottom contains all the possible windows

##### Layouts

Settings for how the nodes are layed out on the page, from automatic placement algorithms, to use groups or bubble sets, displaying all or only current request edges, theming, and animation duration.

Additionally there are style rules, which determine the color and shape of all nodes on the page.

The pattern can be inputted any valid Regular Expression for nodes to match - this will be ran on the filename - in addition to the color and shape to make matching nodes.

##### Requests

The Request inspector allows one to see all the requests that have come in, the events associated for each, and the ability to navigate through all of them one by one - which updates the contents of other windows appropriately.

Events that have been indented with hyphens are detected as sub-events, for example events that occurred within a unique Express Router.

> The Event toast that appears within the graph contains all known links for the event in question - from where it was added to the application, where it was evaluated, router construction, etc - all clickable to open the file to that location in Visual Studio Code

##### Request Inspector

Shows the changes to the request due to the currently selected event.

##### Response Inspector

Shows the changes to the request due to the currently selected event - additionally shows data passed to view rendering, sent data, and more output-related information.

##### Current Code

The current code for the selected middleware

##### All Code

All of the code for the current request, with render buttons to render straight to that event in question.

### How it works

Overriding all request-handler receiving methods - `.use`, `.get`, `.post`, etc - middlewares are tracked.

Manual overrides of common method such as `response.send`, `response.json`, `response.render`, `response.redirect`.

Discovery of dependencies via [dependency-cruiser](https://github.com/sverweij/dependency-cruise).

Routing override logic inspired by [`express-promise-router`](https://github.com/express-promise-router/express-promise-router).

Cloning done via [`@ungap/structured-clone`](https://github.com/ungap/structured-clone).
