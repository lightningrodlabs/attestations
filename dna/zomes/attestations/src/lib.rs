use attestation::Attestation;
pub use error::{AttestationsError, AttestationsResult};

pub use hdk::prelude::Path;
pub use hdk::prelude::*;

pub mod attestation;
pub mod error;
pub mod handshake;
pub mod signals;

#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    // grant unrestricted access to accept_cap_claim so other agents can send us claims
    let mut functions = BTreeSet::new();
    functions.insert((zome_info()?.name, "recv_remote_signal".into()));
    functions.insert((zome_info()?.name, "recv_handshake".into()));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        // empty access converts to unrestricted
        access: ().into(),
        functions,
    })?;
    Ok(InitCallbackResult::Pass)
}

entry_defs![
    PathEntry::entry_def(),
    attestation::Attestation::entry_def()
];

#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    match op {
        Op::StoreElement { element: _ } => Ok(ValidateCallbackResult::Valid),
        Op::StoreEntry { .. } => Ok(ValidateCallbackResult::Valid),
        Op::RegisterCreateLink {
            base: _,
            target,
            create_link,
        } => {
            let hashed = create_link.hashed;
            let (create, _header) = hashed.into_inner();
            if create.tag == LinkTag::new("by") {
                Ok(ValidateCallbackResult::Valid)
            } else if create.tag == LinkTag::new("of") {
                Ok(ValidateCallbackResult::Valid)
            } else {
                let attestation: Attestation = target.try_into()?;
                let agent = AgentPubKey::try_from(SerializedBytes::try_from(create.tag)?)?;

                if AgentPubKey::from(attestation.about) == agent {
                    Ok(ValidateCallbackResult::Valid)
                } else {
                    Ok(ValidateCallbackResult::Invalid(
                        "tag doesn't point to about".to_string(),
                    ))
                }
            }
        }
        Op::RegisterDeleteLink { create_link: _, .. } => Ok(ValidateCallbackResult::Invalid(
            "deleting links isn't valid".to_string(),
        )),
        Op::RegisterUpdate { .. } => Ok(ValidateCallbackResult::Invalid(
            "updating entries isn't valid".to_string(),
        )),
        Op::RegisterDelete { .. } => Ok(ValidateCallbackResult::Invalid(
            "deleting entries isn't valid".to_string(),
        )),
        Op::RegisterAgentActivity { .. } => Ok(ValidateCallbackResult::Valid),
    }
}
