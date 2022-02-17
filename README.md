# attestations

A holochain happ for recording attestations

##  Background

TODO

## Design

For more details read the [design documents](DESIGN.md).

## Installation

1. Install the holochain dev environment: https://developer.holochain.org/docs/install/
2. Clone this repo: `git clone https://github.com/lightningrodlabs/attestations && cd ./attestations`
3. Enter the nix shell: `nix-shell`
4. Install the dependencies with: `npm install`

## Building the DNA

- Build the DNA (assumes you are still in the nix shell for correct rust/cargo versions from step above):
  - Assemble the DNA:

```bash
npm run build:happ
```

### Running the DNA tests
```bash
npm run test
```

## UI

To test out the UI:

``` bash
npm run start
```

## Package

To package the web happ:

``` bash
npm run package
```

You'll have the `attestations.webhapp` in `workdir`, and it's component `attestations.happ` in `dna/workdir/happ`, and `ui.zip` in `ui/apps/attestations`.

## License
[![License: CAL 1.0](https://img.shields.io/badge/License-CAL%201.0-blue.svg)](https://github.com/holochain/cryptographic-autonomy-license)

  Copyright (C) 2022, Harris-Braun Enterprises, LLC

This program is free software: you can redistribute it and/or modify it under the terms of the license
provided in the LICENSE file (CAL-1.0).  This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
