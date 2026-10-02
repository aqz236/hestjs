# create-hest-app

The easiest way to get started with HestJS is by using `create-hest-app`. This CLI tool enables you to quickly start building a new HestJS application, with everything set up for you.

## Quick Start

To get started, use the following command:

### Interactive

You can create a new project interactively by running:

```bash
npx create-hest-app@latest
# or
yarn create hest-app
# or
pnpm create hest-app
# or
bun create hest-app
```

# create-hest-app

The easiest way to get started with HestJS is by using `create-hest-app`. This CLI tool enables you to quickly start building a new HestJS application, with everything set up for you.

## Quick Start

To get started, use the following command:

```bash
npx create-hest-app@latest
# or
yarn create hest-app
# or 
pnpm create hest-app
# or
bun create hest-app
```

To create a new app in a specific folder, you can send a name as an argument. For example, the following command will create a new HestJS app called `blog-app` in a folder with the same name:

```bash
npx create-hest-app@latest blog-app
```

## Options

`create-hest-app` comes with the following options:

- **--eslint, --no-eslint** - Initialize with ESLint configuration. (default: true)
- **--template [name]** - Initialize with a specific template. Available templates: `base`, `cqrs`
- **--use-npm** - Explicitly tell the CLI to bootstrap the app using npm
- **--use-pnpm** - Explicitly tell the CLI to bootstrap the app using pnpm  
- **--use-yarn** - Explicitly tell the CLI to bootstrap the app using Yarn
- **--use-bun** - Explicitly tell the CLI to bootstrap the app using Bun
- **--skip-install** - Explicitly tell the CLI to skip installing packages

## Interactive Experience

When you run `npx create-hest-app@latest` with no arguments, it launches an interactive experience that guides you through setting up a project.

### On installation, you'll see the following prompts:

```
✔ Would you like to use ESLint? No
✔ Which template would you like to use? Base - A simple HestJS application with basic features
✔ Would you like to include Swagger/Scalar API documentation? (adds ~12MB to build size) No
✔ Which package manager would you like to use? bun
✔ Skip installing dependencies? Yes
Creating a new HestJS app in /private/tmp/test-hest-app.

Using template: base
Copying files from template...

Template files copied successfully!

Updated package.json with new app name: test-hest-app

Success! Created test-hest-app at test-hest-app
Inside that directory, you can run several commands:

  bun dev
    Starts the development server.

  bun build
    Builds the app for production.

  bun start
    Runs the built app in production mode.

Dependencies were not installed. To install them, run:

  cd test-hest-app
  bun install

Then start the development server:

  bun dev
```

## Templates

`create-hest-app` ships with two templates:

### Base Template
A simple HestJS application with basic features including:
- Basic controller and service structure
- Dependency injection with TSyringe
- Exception handling
- Request/response interceptors
- Built on Hono for high performance

### CQRS Template  
A complete application implementing the CQRS (Command Query Responsibility Segregation) pattern:
- Command and Query handlers
- Event-driven architecture
- Domain entities and repositories
- User management example with CRUD operations
- Advanced validation and error handling
- All Base template features included

### Swagger/Scalar Documentation
Both templates can optionally include Swagger/Scalar API documentation:
- Interactive API documentation
- Type-safe schema generation
- Adds approximately 12MB to the final build size
- Perfect for API development and testing

## Why use Create HestJS App?

`create-hest-app` allows you to create a new HestJS app within seconds. It is officially maintained by the HestJS team, and includes a number of benefits:

- **Interactive Experience**: Running `npx create-hest-app@latest` (with no arguments) launches an interactive experience that guides you through setting up a project.
- **Zero Dependencies**: Initializing a project is as quick as one command. No need to install or configure tools like TypeScript, ESLint, etc.
- **Tested**: The package is tested against all of its templates to ensure each one boots successfully.
- **Up to date**: Templates are kept up to date with the latest versions of HestJS and its ecosystem.

## System Requirements

- Node.js 18.0 or later
- macOS, Windows (including WSL), and Linux are supported

## License

MIT

### Non-interactive

You can also pass command line arguments to set up a new project non-interactively. See `create-hest-app --help`:

```bash
Usage: create-hest-app [project-directory] [options]

Options:
  -V, --version                        display version number
  --ts, --typescript                   initialize as a TypeScript project (default)
  --js, --javascript                   initialize as a JavaScript project
  --eslint                             initialize with ESLint config
  --use-npm                            explicitly tell the CLI to bootstrap the app using npm
  --use-pnpm                           explicitly tell the CLI to bootstrap the app using pnpm
  --use-yarn                           explicitly tell the CLI to bootstrap the app using Yarn
  --use-bun                            explicitly tell the CLI to bootstrap the app using Bun
  --skip-install                       explicitly tell the CLI to skip installing packages
  --template <template-name>           specify the template to use (basic, api, full-featured)
  -h, --help                           display help for command
```

## Why use Create HestJS App?

`create-hest-app` allows you to create a new HestJS app within seconds. It is officially maintained by the creators of HestJS, and includes a number of benefits:

- **Interactive Experience**: Running `npx create-hest-app@latest` (with no arguments) launches an interactive experience that guides you through setting up a project.
- **Zero Dependencies**: Initializing a project is as quick as one second. Create HestJS App has zero dependencies.
- **Offline Support**: Create HestJS App will automatically detect if you're offline and bootstrap your project using your local package cache.
- **Support for Examples**: Create HestJS App can bootstrap your application using different templates (basic, api, full-featured).
- **Tested**: The package is part of the HestJS monorepo and tested using the same integration test suite as HestJS itself, ensuring it works as expected with every release.

## Templates

### Basic
A simple HestJS application with minimal setup. Perfect for getting started quickly.

### API  
A RESTful API template with validation, documentation, and best practices for building APIs.

### Full-featured
A complete application template with all HestJS features including CQRS, validation, logging, and more.

## Getting Started

After the installation is complete:

- Run `npm run dev` or `yarn dev` or `pnpm dev` or `bun dev` to start the development server on `http://localhost:3000`
- Visit `http://localhost:3000` to view your application
- Edit `src/index.ts` and see your changes reflected in the browser

## Learn More

To learn more about HestJS, take a look at the following resources:

- [HestJS Documentation](https://hestjs.dev) - learn about HestJS features and API
- [Learn HestJS](https://hestjs.dev/learn) - an interactive HestJS tutorial

## Contributing

We welcome contributions to create-hest-app! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT
