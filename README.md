
![Meanie](https://raw.githubusercontent.com/meanie/meanie/master/meanie-logo-full.png)

[![npm version](https://img.shields.io/npm/v/meanie.svg)](https://www.npmjs.com/package/meanie)
[![node dependencies](https://david-dm.org/meanie/meanie.svg)](https://david-dm.org/meanie/meanie)
[![github issues](https://img.shields.io/github/issues/meanie/meanie.svg)](https://github.com/meanie/meanie/issues)
[![codacy](https://img.shields.io/codacy/746f62db3e70495da98bca9da333ec8e.svg)](https://www.codacy.com/app/meanie/meanie)
[![gitter](https://img.shields.io/badge/gitter-join%20chat%20%E2%86%92-brightgreen.svg)](https://gitter.im/meanie/meanie?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Meanie is a collection of boilerplate code and libraries for developing, testing and building javascript applications using the MEAN stack (MongoDB, Express, Angular and Node).

This package contains the Meanie CLI tool which can be used as a helper to seed new Meanie projects and install or update other Meanie libraries.

For more information about the various seed projects, please check the respective repositories:
  - [Angular 1 seed](https://github.com/meanie/angular-seed)
  - [Angular 2 seed](https://github.com/meanie/angular2-seed)
  - [Express seed](https://github.com/meanie/express-seed)

## Installation

```shell
npm install -g meanie
```

## Usage

### 1. Seed a new Meanie project

```shell
# Seed an Angular 1 client side project
meanie seed angular

# Seed an Angular 2 client side project
meanie seed angular2

# Seed an Express server side project
meanie seed express
```

### 2. Install any additional libraries you'd like

```shell
meanie install angular-storage angular-api angular-modal
```

To find out what other Meanie moduels and libraries are available, check [Meanie on github](https://github.com/meanie) or find [Meanie modules in the npm registry](https://www.npmjs.com/search?q=meanie-module).

### 3. Start the app!

```shell
npm start
```

## Issues & feature requests

Please report any bugs, issues, suggestions and feature requests in the appropriate issue tracker:
* [Angular 1 seed issue tracker](https://github.com/meanie/angular-seed/issues)
* [Angular 2 seed issue tracker](https://github.com/meanie/angular2-seed/issues)
* [Express seed issue tracker](https://github.com/meanie/express-seed/issues)
* [Meanie CLI issue tracker](https://github.com/meanie/meanie/issues)

Feedback in general is also welcome! Come chat with us in the [Gitter room](https://gitter.im/meanie/meanie).

## Contributing

If you would like to contribute to Meanie, please check out [CONTRIBUTING.md](https://github.com/meanie/meanie/blob/master/CONTRIBUTING.md).

## Further reading

* [Editor config](http://editorconfig.org)
* [Bower configuration](http://bower.io/docs/config/)
* [JSHint configuration](http://jshint.com/docs/options/)
* [Package.json configuration](https://docs.npmjs.com/files/package.json)
* [Debugging Javascript](https://developer.chrome.com/devtools/docs/javascript-debugging)

## Credits

* Logo designed by [Quan-Lin Sim](mailto:quan.lin.sim+meanie@gmail.com)
* MEAN name coined by [Valeri Karpov](http://blog.mongodb.org/post/49262866911/the-mean-stack-mongodb-expressjs-angularjs-and)
* CLI tool inspired by [Gulp](https://github.com/gulpjs/gulp) and [npm](https://github.com/npm/npm).

## License

(MIT License)

Copyright 2015-2016, [Adam Buczynski](http://adambuczynski.com)
