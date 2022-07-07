# attestations

Verifiable claims in the holochain world, i.e. "Who said what about/to whom"

## Context

Cryptographically verifiable claims are quite usefull for a number of scenarios, see: Wiki.

Interestingly, every entry committe by an agent in a holochain application can be used as a veriable claim,
because Holochain keeps track of the signed actions of every entry which include the entry hash. Holochain
natively validates these actions to ensure data integrity.

By creating a very simple entry of the form:

```rust
struct Attestation {
  content: String,
  about: AgentPubKey64,
}
```

agents can claim arbitrary content about any other agent in a holochain DHT space. The signed actions of such
entries can be shared and thus that claim by be confirmed by anyone as having been said by the attester.

### Use cases

#### Membrane Crossing
- **Holochain Membrane Proofs**: Holochain hApps can take membrane proofs that check ability of an agent to join a hApp. Attestations can be easily used as such proofs (see elemental-chat)
- **DAO Discord access**: A common use case for NFTs in web3 happs, is to use them to verify that a given person can, for example take part 
in a given Discord channel.  One can do the same with an instance of this holochain hApp, where a given agent makes
attestations of other agents permissions, which are read by a discord server bot to allow access.

#### Transferable NFTs

Minting an NFT is the same as making an attestation about yourself as being the owner of a given digital asset.  The asset could litterally be included in the content of the attestation.  Transfering the NFT is just making an attestation that you have done so with the about being who you are transferring it to, and including the hash of the original attestation entry in content.  Subsequent transfers simply include the hash of the previous attestation, thus creating a chain of custody.

#### Reviews/Ratings/Badges/Certificates

These are kind of obvious as they are all clearly just attestations by some authority about a agent.

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

```bash
npm run start
```

## Package

To package the web happ:

```bash
npm run package
```

You'll have the `attestations.webhapp` in `workdir`, and it's component `attestations.happ` in `dna/workdir/happ`, and `ui.zip` in `ui/apps/attestations`.

## License

[![License: CAL 1.0](https://img.shields.io/badge/License-CAL%201.0-blue.svg)](https://github.com/holochain/cryptographic-autonomy-license)

Copyright (C) 2022, Harris-Braun Enterprises, LLC

This program is free software: you can redistribute it and/or modify it under the terms of the license
provided in the LICENSE file (CAL-1.0). This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
