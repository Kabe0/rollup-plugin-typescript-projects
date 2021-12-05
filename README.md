# typescript-plugin
Early prototype plugin Typescript References for Rollup.

## Current Outstanding Issues:
- Errors are not captured gracefully.
- Compiling Times are quite slow.
- Configs cannot be overridden.
- I am suspecting watches are causing colliding multiple compilations.
- CWD is fixed to the folder rollup is run on.
- includeUnusedFiles could be done per project, as of right now it's a global toggle.
  - It does not currently support a single file output. This is due to how rollup handles isolated chunks. Will need to look into this more.

## How to build
To build this project you can run `yarn install`. You may run the following yarn commands for this project
- `yarn build` Will build the project once
- `yarn watch` Will build, then watch future file changes
- `yarn test`  Will run the jest test cases
- `yarn test-coverage` Will run the jest tests and provide a coverage report in the project folder.

If you want to link this project to your existing project, you can use `yarn link` which will create a symlink
between the two projects. 
1. Run `yarn link` inside the typescript-plugin project. This should create a message saying the project link and how to symlink
2. Navigate to your other project, and run `yarn link typescript-plugin` which will link the project together.
3. Run the steps as desired in 'How to set up a project' to get the typescript package included.

## How to set up a project
You will need Rollup version 1.62.1 or later for this project to fully work as intended.

The below example is a website ready configuration using ESM module loading.
```javascript
import typescript from "typescript-plugin"
import { nodeResolve } from "@rollup/plugin-node-resolve";
import nodePolyfills from 'rollup-plugin-polyfill-node';
import commonjs from '@rollup/plugin-commonjs';
import css from "rollup-plugin-import-css";
import json from '@rollup/plugin-json';

export default {
    input: './src/index.ts',
    output: {
        dir: './dist',
        format: 'esm',
        preserveModules: true,
        preserveModulesRoot: '',
        sourcemap: true,
    },
    plugins: [
        typescript({
            includeUnusedFiles: true    // Can be toggled on to aggressivly load all files in the project
        }),
        css({output: "vendor.css"}),
        json(),
        commonjs(),
        nodePolyfills(),
        nodeResolve({ preferBuiltins: false }),
    ]
}
```

If bundling is preferred, the module configuration can be turned into the following to make as a single bundled file.
Please be aware that includeUnusedFiles cannot be turned on if a single output is specified.
```javascript
import typescript from "typescript-plugin"
import { nodeResolve } from "@rollup/plugin-node-resolve";
import nodePolyfills from 'rollup-plugin-polyfill-node';
import commonjs from '@rollup/plugin-commonjs';
import css from "rollup-plugin-import-css";
import json from '@rollup/plugin-json';

export default {
    input: './src/index.ts',
    output: {
        format: 'esm',
        sourcemap: true,
        file: 'bundle.js'
    },
    plugins: [
        typescript(),
        css({output: "vendor.css"}),
        json(),
        commonjs(),
        nodePolyfills(),
        nodeResolve({ preferBuiltins: false }),
    ]
}
```

### Typescript config
For typescript to compile, it's important to configure the project properly, especially when loading for multiple projects.

#### Folder Structure
A typical project folder structure might look like the following:
```
 - project
   - config
     - tsconfig.base.json             # Shared
   - packages
     - project1
       - IncludedFile.ts
       - tsconfig.json
   - src
     - main.ts
   - tsconfig.json
```
It's critical that all paths are under one single main project. You cannot have different configs with conflicting
baseUrls.

#### Configs

You will want to create a shared config. This will be used to keep common details such as aliases. I have provided
an example below for the `config/typescript/tsconfig.base.json`
#### config/typescript/tsconfig.base.json
```json
{
  "compilerOptions": {
    "composite": true,
    "noEmit": false,
    "paths": {
      "@project1/*": ["packages/project1/*"],
      "@main/*": ["src/*"]
    }
  }
}

```

On the root of a project, a main tsconfig should be configured. You can modify as desired, but it's critical that
a baseUrl, rootDir, and outDir are provided. This helps with the compiler. I have not tested a non outDir based project,
but it should work.

#### project/tsconfig.base.json
```json
{
  "extends": "./config/typescript/tsconfig.base.json",
  "include": [
    "src/*"
  ],
  "compilerOptions": {
    "module": "es2020",
    "target": "es2020",
    "strict": true,
    "baseUrl": "./",
    "rootDir": "./",
    "outDir": "./build/"
  },
  "references": [
    {
      "path": "packages/project1"
    }
  ]
}
```

In the package `project1`, create another Typescript config file to handle its own configurations. 
You can change project configs if necessary, but keeping them the same between projects should result in better
bundles.

#### project/packages/project1/tsconfig.base.json
```json
{
  "extends": "../../config/tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": "../../",
    "rootDir": "../../",
    "outDir": "../../build/",
    "module": "es2020",
    "target": "es2020"
  },
  "include": ["."]
}
```

### Reference
If you want to see what a multi-project config can look like, take a look at the test fixtures labeled `mutli-project` inside this repository.