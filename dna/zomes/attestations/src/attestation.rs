use std::collections::HashMap;

pub use hdk::prelude::*;
use hdk::prelude::holo_hash::{AgentPubKeyB64, EntryHashB64};
use attestations_core::{EntryTypes, Attestation, LinkTypes};

use crate::error::*;
//use crate::signals::*;

/// Attestation entry definition
#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all="camelCase")]
pub struct Verifiable {
    pub attestation: Option<Attestation>,
    pub signed_actions: Vec<SignedActionHashed>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct AttestationContext {
    author: AgentPubKeyB64,
    timestamp: Timestamp,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all="camelCase")]
pub struct AttestationOutput {
    pub hash: EntryHashB64,
    pub attesters: Vec<AttestationContext>,
    pub content: Attestation,
    pub verifiable: Verifiable,
}

fn get_my_attestations_base() -> ExternResult<EntryHash> {
    let me: AgentPubKey = agent_info()?.agent_latest_pubkey;
    Ok(me.into())
}

fn get_agent_attestations_base(agent: AgentPubKey) -> ExternResult<EntryHash> {
    Ok(agent.into())
}

#[hdk_extern]
pub fn create_attestation(input: Attestation) -> ExternResult<EntryHashB64> {
    let _action_hash = create_entry(EntryTypes::Attestation(input.clone()))?;
    let hash = hash_entry(input.clone())?;
//    emit_signal(&SignalPayload::new(hash.clone().into(), Message::NewAttestation(input.clone())))?;
    create_link(get_my_attestations_base()?, hash.clone(), LinkTypes::By, ())?;
    create_link(get_agent_attestations_base(input.about.clone().into())?, hash.clone(), LinkTypes::Of, ())?;
    let path = Path::from(input.content);
    create_link(path.path_entry_hash()?, hash.clone(), LinkTypes::Who, LinkTag::from(AgentPubKey::from(input.about).as_ref().to_vec()))?;
    Ok(hash.into())
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct GetAttestationsInput {
    pub content: Option<String>,
    pub by: Option<AgentPubKeyB64>,
    pub of: Option<AgentPubKeyB64>,
}

///
#[hdk_extern]
pub fn get_attestations(input: GetAttestationsInput) -> ExternResult<Vec<AttestationOutput>> {
    match input.content {
        Some(content) => {
            let base = Path::from(content).path_entry_hash()?;
            let (link_type, tag) = match input.of {
                Some(agent) =>  (Some(LinkTypes::Who), Some(LinkTag::new(AgentPubKey::from(agent).as_ref().to_vec()))),
                None => (None, None)
            };
            let attestations = get_attestations_inner(base, link_type, tag)?;
            Ok(attestations)
        },
        None => {
            // collect results in a hashmap to remove dups
            let mut results: HashMap<EntryHashB64,AttestationOutput> = HashMap::new();
            if let Some(agent) = input.of {
                    let base = get_agent_attestations_base(agent.into())?;
                    let attestations = get_attestations_inner(base, Some(LinkTypes::Of), None)?;
                    for a in attestations {
                        results.insert(a.hash.clone(), a);
                    }
            };
            if let Some(agent) = input.by {
                let base = get_agent_attestations_base(agent.into())?;
                let attestations = get_attestations_inner(base, Some(LinkTypes::By), None)?;
                for a in attestations {
                    results.insert(a.hash.clone(), a);
                }
            };
            Ok(results.into_iter().map(|(_,a)| a).collect())
        }
    }
}

///
#[hdk_extern]
fn get_my_attestations(_: ()) -> ExternResult<Vec<AttestationOutput>> {
    let base = get_my_attestations_base()?;
    let records = get_attestations_inner(base,Some(LinkTypes::By), None)?;
    Ok(records)
}


pub fn get_attestations_inner(base: EntryHash, maybe_link_type: Option<LinkTypes>, maybe_tag: Option<LinkTag>) -> AttestationsResult<Vec<AttestationOutput>> {
    let links = match maybe_link_type {
        Some(link_type) => get_links(base, link_type, maybe_tag)?,
        None => get_links(base, .., maybe_tag)?,
    };

    let get_input = links
        .into_iter()
        .map(|link| GetInput::new(EntryHash::from(link.target).into(), GetOptions::default()))
        .collect();

    let attestation_elements = HDK.with(|hdk| hdk.borrow().get_details(get_input))?;

    let attestations: Vec<AttestationOutput> = attestation_elements
        .into_iter()
        .filter_map(|me| me)
        .filter_map(|details| match details {
            Details::Entry(EntryDetails { entry, actions, .. }) => {
                let attestation: Attestation = entry.try_into().ok()?;
                let hash = hash_entry(&attestation).ok()?;
                Some(AttestationOutput {
                    hash: hash.into(),
                    attesters: actions.clone().into_iter().map(|action| {
                        let h = action.action();
                        AttestationContext {
                            author: h.author().clone().into(),
                            timestamp: h.timestamp(),
                        }
                    }).collect(),
                    verifiable: Verifiable {
                        signed_actions: actions,
                        attestation: None,
                    },
                    content: attestation,
                })
            }
            _ => None,
        })
        .collect();
    Ok(attestations)
}

///
#[hdk_extern]
pub fn verify(input: Verifiable) -> ExternResult<()>  {
    for signed_action in input.signed_actions {
        if let Some(ref attestation) = input.attestation {
            let hash = hash_entry(attestation)?;
            let action_hash = signed_action.action().entry_hash().ok_or(wasm_error!(WasmErrorInner::Guest("Failed verification: couldn't get hash from action".into())))?;
            if  *action_hash != hash {
                return Err(wasm_error!(WasmErrorInner::Guest("Failed verification: attestation hash doesn't match".into())));
            }
        }
        let signature = signed_action.signature().clone();
        match verify_signature(signed_action.action().author().clone(), signature, signed_action.action()) {
            Ok(verified) => {
                if verified {
                } else {
                    return Err(wasm_error!(WasmErrorInner::Guest("Failed verification: signature doesn't match.".into())))
                }
            }
            Err(e) => {
                return Err(wasm_error!(WasmErrorInner::Guest(format!("Failed verification: error checking signature {}", e.to_string()))));
            }
        }
    }
    Ok(())
}