use std::collections::HashMap;

pub use hdk::prelude::*;
use hdk::prelude::holo_hash::{AgentPubKeyB64, EntryHashB64};

use crate::error::*;
//use crate::signals::*;

/// Attestation entry definition
#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all="camelCase")]
pub struct Verifiable {
    pub attestation: Option<Attestation>,
    signed_headers: Vec<SignedHeaderHashed>,
}

/// Attestation entry definition
#[hdk_entry(id = "attestation")]
#[derive(Clone)]
pub struct Attestation {
    pub content: String,
    pub about: AgentPubKeyB64,
}
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct AttestationContext {
    author: AgentPubKeyB64,
    timestamp: Timestamp,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all="camelCase")]
pub struct AttestationOutput {
    hash: EntryHashB64,
    attesters: Vec<AttestationContext>,
    content: Attestation,
    verifiable: Verifiable,
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
    create_link(path.path_entry_hash()?, hash.clone(), LinkTag::from(AgentPubKey::from(input.about).as_ref().to_vec()))?;
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
fn get_attestations(input: GetAttestationsInput) -> ExternResult<Vec<AttestationOutput>> {
    match input.content {
        Some(content) => {
            let base = Path::from(content).path_entry_hash()?;
            let tag = match input.of {
                Some(agent) => Some(LinkTag::new(AgentPubKey::from(agent).as_ref().to_vec())),
                None => None
            };
            let attestations = get_attestations_inner(base, tag)?;
            Ok(attestations)
        },
        None => {
            // collect results in a hashmap to remove dups
            let mut results: HashMap<EntryHashB64,AttestationOutput> = HashMap::new();
            if let Some(agent) = input.of {
                    let base = get_agent_attestations_base(agent.into())?;
                    let attestations = get_attestations_inner(base, Some(LinkTag::new("of")))?;
                    for a in attestations {
                        results.insert(a.hash.clone(), a);
                    }
            };
            if let Some(agent) = input.by {
                let base = get_agent_attestations_base(agent.into())?;
                let attestations = get_attestations_inner(base, Some(LinkTag::new("by")))?;
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
                let attestation: Attestation = entry.try_into().ok()?;
                let hash = hash_entry(&attestation).ok()?;
                Some(AttestationOutput {
                    hash: hash.into(),
                    attesters: headers.clone().into_iter().map(|header| {
                        let h = header.header();
                        AttestationContext {
                            author: h.author().clone().into(),
                            timestamp: h.timestamp(),
                        }
                    }).collect(),
                    verifiable: Verifiable {
                        signed_headers: headers,
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
fn verify(input: Verifiable) -> ExternResult<()>  {
    for signed_header in input.signed_headers {
        if let Some(ref attestation) = input.attestation {
            let hash = hash_entry(attestation)?;
            let header_hash = signed_header.header().entry_hash().ok_or(WasmError::Guest("Failed verification: couldn't get hash from header".into()))?;
            if  *header_hash != hash {
                return Err(WasmError::Guest("Failed verification: attestation hash doesn't match".into()));
            }
        }
        let signature = signed_header.signature().clone();
        match verify_signature(signed_header.header().author().clone(), signature, signed_header.header()) {
            Ok(verified) => {
                if verified {
                } else {
                    return Err(WasmError::Guest("Failed verification: signature doesn't match.".into()))
                }
            }
            Err(e) => {
                return Err(WasmError::Guest(format!("Failed verification: error checking signature {}", e.to_string())));
            }
        }
    }
    Ok(())
}