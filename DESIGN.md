# Attestations

Verifiable claims in the holochain world, i.e. "Who said what about/to whom"

## Context

**Attestations** provides a simple holochain app for recording claims about another agent.

## Linking Structure

When attestations are created they are linked from the creator and from who they are about, as 
well as being linked from an anchor hash of the content itself.  

This allows attestations to be retreived by content, by attester and by attestee.

## Entry Types

### Attestation

Specifies an attestation

``` rust
struct Attestation {
  content: String,
  about: AgentPubKey64,
}
```

