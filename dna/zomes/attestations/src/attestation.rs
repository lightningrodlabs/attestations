pub use hdk::prelude::*;
use hdk::prelude::holo_hash::{AgentPubKeyB64, EntryHashB64};

use crate::error::*;
//use crate::signals::*;

/// Attestation entry definition
#[hdk_entry(id = "attestation")]
#[derive(Clone)]
pub struct Attestation {
    pub content: String,
    pub about: AgentPubKeyB64,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct AttestationOutput {
    hash: EntryHashB64,
    attesters: Vec<AgentPubKeyB64>,
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
    create_link(get_agent_attestations_base(input.about.clone().into())?, hash.clone(), LinkTag::new("of"))?;
    let path = Path::from(input.content);
    path.ensure()?;
    create_link(path.path_entry_hash()?, hash.clone(), LinkTag::new(input.about.to_string()))?;
    Ok(hash.into())
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct GetAttestationsInput {
    pub content: Option<String>,
    pub agent: Option<AgentPubKeyB64>,
}

///
#[hdk_extern]
fn get_attestations(input: GetAttestationsInput) -> ExternResult<Vec<AttestationOutput>> {
    match input.content {
        Some(content) => {
            let base = Path::from(content).path_entry_hash()?;
            let tag = match input.agent {
                Some(agent) => Some(LinkTag::new(agent.to_string())),
                None => None
            };
            let attestations = get_attestations_inner(base, tag)?;
            Ok(attestations)
        },
        None => match input.agent {
            Some(agent) => {
                let base = get_agent_attestations_base(agent.into())?;
                let attestations = get_attestations_inner(base, Some(LinkTag::new("of")))?;
                Ok(attestations)
            },
            None => Ok(vec![])
        }
    }
}

///
#[hdk_extern]
fn get_my_attestations(_: ()) -> ExternResult<Vec<AttestationOutput>> {
    let base = get_my_attestations_base()?;
    let records = get_attestations_inner(base,Some(LinkTag::new("by")))?;
    Ok(records)
}


fn get_attestations_inner(base: EntryHash, maybe_tag: Option<LinkTag>) -> AttestationsResult<Vec<AttestationOutput>> {
    let links = get_links(base, maybe_tag)?;

    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(link.target.into(), GetOptions::default()))
        .collect();

    let attestation_elements = HDK.with(|hdk| hdk.borrow().get_details(get_input))?;

    let attestations: Vec<AttestationOutput> = attestation_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|details| match details {
            Details::Entry(EntryDetails { entry, headers, .. }) => {
                let attestation = entry.try_into().ok()?;
                let hash = hash_entry(&attestation).ok()?;
                Some(AttestationOutput {
                    hash: hash.into(),
                    attesters: headers.into_iter().map(|header| header.header().author().clone().into()).collect(),
                    content: attestation,
                })
            }
            _ => None,
        })
        .collect();
    Ok(attestations)
}
