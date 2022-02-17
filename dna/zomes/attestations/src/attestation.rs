pub use hdk::prelude::*;
use hdk::prelude::holo_hash::{AgentPubKeyB64, EntryHashB64};
use std::collections::BTreeMap;

use crate::error::*;
//use crate::signals::*;

/// Attestation entry definition
#[hdk_entry(id = "attestation")]
#[derive(Clone)]
pub struct Attestation {
    pub content: String,
    pub about: AgentPubKeyB64,
    pub meta: BTreeMap<String, String>,  // usable by the UI for whatever
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct AttestationOutput {
    hash: EntryHashB64,
    content: Attestation,
}

fn get_my_attestations_base() -> ExternResult<EntryHash> {
    let me: AgentPubKey = agent_info()?.agent_latest_pubkey;
    Ok(me.into())
}

fn get_agent_attestations_base(agent: AgentPubKey) -> ExternResult<EntryHash> {
    Ok(agent.into())
}

#[hdk_extern]
fn create_attestation(input: Attestation) -> ExternResult<EntryHashB64> {
    let _header_hash = create_entry(&input)?;
    let hash = hash_entry(input.clone())?;
//    emit_signal(&SignalPayload::new(hash.clone().into(), Message::NewAttestation(input.clone())))?;
    create_link(get_my_attestations_base()?, hash.clone(), LinkTag::new("by"))?;
    create_link(get_agent_attestations_base(input.about.into())?, hash.clone(), LinkTag::new("of"))?;
    Ok(hash.into())
}

///
#[hdk_extern]
fn get_attestations(agent: AgentPubKeyB64) -> ExternResult<Vec<AttestationOutput>> {
    let base = get_agent_attestations_base(agent.into())?;
    let attestations = get_attestations_inner(base, LinkTag::new("of"))?;
    Ok(attestations)
}

///
#[hdk_extern]
fn get_my_attestations(_: ()) -> ExternResult<Vec<AttestationOutput>> {
    let base = get_my_attestations_base()?;
    let records = get_attestations_inner(base,LinkTag::new("by"))?;
    Ok(records)
}


fn get_attestations_inner(base: EntryHash, tag: LinkTag) -> AttestationsResult<Vec<AttestationOutput>> {
    let links = get_links(base, Some(tag))?;

    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let attestation_elements = HDK.with(|hdk| hdk.borrow().get(get_input))?;

    let attestation_entries: Vec<Attestation> = attestation_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|element| match element.entry().to_app_option() {
            Ok(Some(g)) => Some(g),
            _ => None,
        })
        .collect();

    let mut attestations = vec![];
    for e in attestation_entries {
        attestations.push(AttestationOutput {
            hash: hash_entry(&e)?.into(),
            content: e,
        });
    }
    Ok(attestations)
}
