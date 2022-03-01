use hdk::prelude::{serde_bytes::ByteBuf, holo_hash::{AgentPubKeyB64}};
pub use hdk::prelude::*;

use crate::attestation::{Attestation, self, GetAttestationsInput, Verifiable};


/// Attestation entry definition
#[hdk_entry(id = "nonce", visibility = "private")]
#[derive(Clone)]
pub struct Nonce {
    pub id: u32,
    pub note: String,
    pub with: AgentPubKeyB64,
}

/// Input to the fulfill_nonce call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateNonceInput {
    pub with: AgentPubKeyB64,
    pub note: String,
}

impl Nonce {
    pub fn new(input: CreateNonceInput) -> ExternResult<Nonce> {
        let id_bytes = random_bytes(4)?;
        let id: u32 = as_u32_be(&id_bytes);    
        Ok(Nonce { id, with: input.with, note: input.note })
    }
}

#[hdk_extern]
fn create_nonce(input: CreateNonceInput) -> ExternResult<u32> {
    let nonce = Nonce::new(input)?;
    let _header_hash = create_entry(&nonce)?;
    Ok(nonce.id)
}

/// Input to the fulfill_nonce call
#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FulfillNonceInput {
    pub with: AgentPubKeyB64,
    pub nonce: u32,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FulfillNonceWire {
    pub header: SignedHeaderHashed,
    pub nonce: String,
}

#[hdk_extern]
fn fulfill_nonce(input: FulfillNonceInput) -> ExternResult<()> {
    let a = Attestation {
        content: input.nonce.to_string(),
        about: input.with.clone(),
    };
    attestation::create_attestation(a.clone())?;
    let get_input = GetAttestationsInput {
        content: Some(a.content.clone()),
        of: Some(a.about.clone()),
        by: None,
    };
    let attestations = attestation::get_attestations(get_input)?;
    let fulfillment = FulfillNonceWire {
        header: attestations[0].verifiable.signed_headers[0].clone(),
        nonce: input.nonce.to_string(),
    };
    let result = call_remote(
        input.with.into(),
        "hc_zome_attestations".into(),
        "recv_fulfillment".into(),
        None,
        ExternIO::encode(fulfillment)?, //input.one_time_key.to_string(),
    )?;
    if let ZomeCallResponse::Ok(io) = result {
        let decoded_result: () = ExternIO::decode(&io)?;
        debug!("got return value {:?}", decoded_result);
        Ok(())
    } else {
        Err(WasmError::Guest(format!("Nonce error: {:?}", result)))
    }
}

fn as_u32_be(array: &ByteBuf) -> u32 {
    ((array[0] as u32) << 24) +
    ((array[1] as u32) << 16) +
    ((array[2] as u32) <<  8) +
    ((array[3] as u32) <<  0)
}


#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct  NonceReceived {
    nonce: String,
    from: AgentPubKeyB64,
}

#[hdk_extern]
fn recv_fulfillment(input: ExternIO) -> ExternResult<()> {
    //let me: AgentPubKeyB64 = agent_info()?.agent_latest_pubkey.into();
    let caller: AgentPubKeyB64 = call_info()?.provenance.into();
    let me = agent_info()?.agent_latest_pubkey;
    debug!("agent info: {:?}", me);
    let meb64: AgentPubKeyB64 = me.into();
    let fulfillment: FulfillNonceWire = ExternIO::decode(&input)?;

    // lookup nonce private entry locally and confirm that the signature and the caller match
    // by building a verifiable with a constructed attestation and calling verify
    let q = ChainQueryFilter::default().entry_type(entry_type!(Nonce)?).include_entries(true);
    let results : Vec<Nonce> = query(q)?.into_iter().filter_map(|element|{
        let nonce: Nonce = element.entry().to_app_option().ok()??;
        if nonce.id.to_string() == fulfillment.nonce && nonce.with == caller {
            Some(nonce)
        } else {
            None
        }   
    }).collect();
    if results.len() == 0 {
        return Err(WasmError::Guest("No such nonce".into()))
    }
    let attestation = Attestation {content: fulfillment.nonce.clone(), about: meb64};
    let verifiable = Verifiable {
        attestation: Some(attestation),
        signed_headers: vec![fulfillment.header.clone()]
    };
    attestation::verify(verifiable.clone())?;
    // tell the client we got valid nonce
    emit_signal(&NonceReceived{nonce: fulfillment.nonce, from: caller.into()})?;
    Ok(())
}

