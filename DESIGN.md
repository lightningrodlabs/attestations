# Attestations

Verifiable claims in the holochain world...

## Context

**Attestations** provides a simple holochain app for recording claims about another agent.

## Linking Structure

When attestations are created they are linked from the creator and from who they are about, as 
well as being linked from an anchor hash of the content itself.  

This allows attestations to be retreived in those ways.

## Entry Types

### Attestation

Specifies an attestation

``` rust
struct Attestation {
  content: String,
  about: AgentPubKey64,
}
```

