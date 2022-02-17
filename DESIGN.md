# Attestations

Verifiable claims in the holochain world...

## Context

**Attestations** provides a simple holochain app for recording claims about another agent.

## Entry Types

### Attestation

Specifies an attestation with meta attributes

``` rust
struct Attestation {
  content: String,
  about: AgentPubKey64,
  meta: HashMap<String, String>,  // usable by the UI for whatever
}
```
