# Meanie

[![npm version](https://img.shields.io/npm/v/meanie.svg)](https://www.npmjs.com/package/meanie)
[![node dependencies](https://david-dm.org/meanie/meanie.svg)](https://david-dm.org/meanie/meanie)
[![github issues](https://img.shields.io/github/issues/meanie/meanie.svg)](https://github.com/meanie/meanie/issues)
[![codacy](https://img.shields.io/codacy/746f62db3e70495da98bca9da333ec8e.svg)](https://www.codacy.com/app/meanie/meanie)
[![gitter](https://img.shields.io/badge/gitter-join%20chat%20%E2%86%92-brightgreen.svg)](https://gitter.im/meanie/meanie?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Meanie is a boilerplate for developing, testing and building full-stack modular javascript applications using MEAN (MongoDB, Express, AngularJS and Node.js). Meanie is powered by the Gulp task runner.

This package contains the Meanie CLI tool which can be used to create new Meanie projects and install other Meanie modules. For more information about the boilerplate itself, please check the [Meanie Boilerplate GitHub repository](https://github.com/meanie/boilerplate) or the [Meanie Boilerplate npm page](https://www.npmjs.com/package/meanie-boilerplate).

## Installation
```shell
# Install meanie CLI globally
npm install -g meanie
```

## Usage
### 1. Create a new Meanie project
```shell
meanie create AppName
```

This will install the following core Meanie modules:
* [boilerplate](https://github.com/meanie/boilerplate)
* [angular-storage](https://github.com/meanie/angular-storage)
* [angular-convert](https://github.com/meanie/angular-convert)
* [angular-filters](https://github.com/meanie/angular-filters)

### 2. Install any additional modules you'd like
```shell
meanie install fontello
```

To find out what Meanie modules are available, check Meanie on [github](https://github.com/meanie) or find Meanie modules in the [npm registry](https://www.npmjs.com/search?q=meanie-module).

### 3. Build and run the app!
```shell
gulp
```

## Gulp tasks
Meanie comes with fully configured [Gulp](http://gulpjs.com/) tasks for all common development and build tasks.

*Note*: The gulpfile for Meanie has been configured for use with Gulp version 4. This version is not officially released yet, but you can install and use the alpha version by following  [these instructions](http://demisx.github.io/gulp4/2015/01/15/install-gulp4.html).

### Default
The default task, which you can run by simply typing `gulp` is to run the three main tasks, build, watch and start. This is perfect for ongoing development.
```shell
$ gulp
```
You can also run these tasks individually if needed.

### Build
Build the application and populate the public folder with compiled javascript, stylesheets and static assets. The build task also lints your files and runs your tests prior to building.
```shell
$ gulp build
```

### Watch
Watch your files for changes and runs linters, unit tests and recompiles the application files as needed.
```shell
$ gulp watch
```
The watch task also comes with livereload, which gets triggered every time the index file is rebuilt. To use it, simply install the [Chrome livereload plugin](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei?hl=en).

### Start
Starts the Node server using [Nodemon](http://nodemon.io/).
```shell
$ gulp start
```

### Testing
You can test your client and server side code without building by using one of the following tasks:
```shell
# Test server side code and client side code
$ gulp test

# Test server side code
$ gulp test-server

# Test client side code
$ gulp test-client
```

### Versioning
There are three versioning tasks which help you bump your version numbers in your package files and automatically update the version in your README file, as well as commit the bump to the repository and tag it with the new version.

This process uses [semantic versioning](https://github.com/npm/node-semver).

```shell
# Bump the patch version (0.1.0 -> 0.1.1)
$ gulp patch

# Bump the minor version (0.1.0 -> 0.2.0)
$ gulp minor

# Bump the major version (0.1.0 -> 1.0.0)
$ gulp major
```

### Helpers
Some of the helper tasks have also been exposed to the CLI:``

```shell
# Cleans the public folder
$ gulp clean

# Copy all static assets to the public folder
$ gulp static
```

## FAQ

#### How is Meanie different from other MEAN boilerplates?
The most important difference between Meanie and other MEAN boilerplates like [MEAN.JS](https://github.com/meanjs/mean), is that Meanie uses a [modular approach to folder/file structuring](http://cliffmeyers.com/blog/2013/4/21/code-organization-angularjs-javascript), whereas most others use more of a "sock drawer" approach to organizing files. Meanie thinks that a modular approach is easier to navigate, easier to reuse/refactor, and easier to develop with.

Other differences are:
* Meanie uses Gulp 4 as it's task runner instead of Grunt.
* Meanie doesn't serve the Angular HTML files as views, but instead leverages powerful Gulp tasks to compile and pre-process these files.
* Meanie has a simple overarching environment/configuration system that makes it a breeze to use your specific environment configuration options in your server app, client app, and even in your gulpfile and Karma configuration file.

#### Why doesn't Meanie use Yeoman?
[Yeoman](http://yeoman.io/) prescribes a particular folder structure (e.g. must have /app in your root), whereas Meanie likes to split your code between server/ and client/ first.

#### Why can't I simply install Meanie modules with npm?
Unfortunately, npm currently doesn't support moving package code outside of the `node_modules` folder. Since the Meanie boilerplate has to reside in your project folder and not in `node_modules`, it was necessary to circumvent this limitation by creating a custom CLI tool.

If at some point npm and Bower somehow fuse into a single wonderful tool to manage both client and server side dependencies, Meanie will be the first to use it!

#### What if I want to use different server architecture?
Just delete the `server` folder and replace it with whatever you'd like to use. You can use backend mocks for the client application by installing the [Meanie Backend Mocks](https://github.com/meanie/meanie-backend-mocks) module.

#### What if I want to use different client architecture?
The Meanie client app is built on the AngularJS framework. If you want to use a different framework, it is recommended you find a different boilerplate, suited for that specific framework.

## Issues & feature requests
Please report any bugs, issues, suggestions and feature requests in the appropriate issue tracker:
* [Meanie Boilerplate issue tracker](https://github.com/meanie/boilerplate/issues)
* [Meanie CLI issue tracker](https://github.com/meanie/meanie/issues)

## Contributing
If you would like to contribute to Meanie, please check out [CONTRIBUTING.md](https://github.com/meanie/meanie/blob/master/CONTRIBUTING.md).

## Further reading
* [Modular vs sock drawer folder structure](http://cliffmeyers.com/blog/2013/4/21/code-organization-angularjs-javascript)
* [Editor config](http://editorconfig.org)
* [Bower configuration](http://bower.io/docs/config/)
* [JSHint configuration](http://jshint.com/docs/options/)
* [Package.json configuration](https://docs.npmjs.com/files/package.json)
* [Debugging Javascript](https://developer.chrome.com/devtools/docs/javascript-debugging)

## Credits
* Server side logic partially derived from [MEAN.JS](https://github.com/meanjs/mean)
* MEAN name coined by [Valeri Karpov](http://blog.mongodb.org/post/49262866911/the-mean-stack-mongodb-expressjs-angularjs-and)
* CLI tool inspired by [Gulp](https://github.com/gulpjs/gulp) and [npm](https://github.com/npm/npm).

## License
(MIT License)

Copyright 2015, [Adam Buczynski](http://adambuczynski.com)
