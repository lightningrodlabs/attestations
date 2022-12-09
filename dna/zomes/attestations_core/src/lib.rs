use hdi::prelude::*;

use hdk::prelude::holo_hash::{AgentPubKeyB64};

/// Attestation entry definition
#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
#[derive(Clone)]
pub struct Attestation {
    pub content: String,
    pub about: AgentPubKeyB64,
}

/// Nonce entry definition
#[hdk_entry_helper]
#[derive(Clone)]
pub struct Nonce {
    pub id: u32,
    pub note: String,
    pub with: AgentPubKeyB64,
}

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    #[entry_def(required_validations = 5)]
    Attestation(Attestation), 
    #[entry_def(required_validations = 5, visibility= "private")]
    Nonce(Nonce), 
}

#[hdk_link_types]
pub enum LinkTypes {
    Of,
    By,
    Who,
}

#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    match op {
        Op::StoreRecord ( _ ) => Ok(ValidateCallbackResult::Valid),
        Op::StoreEntry { .. } => Ok(ValidateCallbackResult::Valid),
        Op::RegisterCreateLink (create_link) => {
            //let hashed = create_link.hashed;
            let (create, _action) = create_link.create_link.into_inner();
            let link_type = LinkTypes::try_from(ScopedLinkType {
                zome_index: create.zome_index,
                zome_type: create.link_type,
            })?;
            if link_type == LinkTypes::By {
                Ok(ValidateCallbackResult::Valid)
            } else if link_type == LinkTypes::Of {
                Ok(ValidateCallbackResult::Valid)
            } else if link_type == LinkTypes::Who {
                let attestation: Attestation = must_get_entry(create.target_address.clone().into())?.try_into()?;
                let agent = AgentPubKey::try_from(SerializedBytes::try_from(create.tag.clone()).map_err(|e| wasm_error!(e))?).map_err(|e| wasm_error!(e))?;

                if AgentPubKey::from(attestation.about) == agent {
                    Ok(ValidateCallbackResult::Valid)
                } else {
                    Ok(ValidateCallbackResult::Invalid(
                        "tag doesn't point to about".to_string(),
                    ))
                }
            } else {
                Ok(ValidateCallbackResult::Invalid(
                    "unknown link type".to_string(),
                ))
            }
        }
        Op::RegisterDeleteLink (_)=> Ok(ValidateCallbackResult::Invalid(
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
