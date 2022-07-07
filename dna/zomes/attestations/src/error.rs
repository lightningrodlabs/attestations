use hdk::prelude::*;
use std::convert::Infallible;

#[derive(thiserror::Error, Debug)]
pub enum AttestationsError {
    #[error(transparent)]
    Serialization(#[from] SerializedBytesError),
    #[error(transparent)]
    Infallible(#[from] Infallible),
    #[error(transparent)]
    EntryError(#[from] EntryError),
    #[error("Failed to convert an agent link tag to an agent pub key")]
    AgentTag,
    #[error(transparent)]
    Wasm(#[from] WasmError),
    #[error(transparent)]
    Timestamp(#[from] TimestampError),
}

pub type AttestationsResult<T> = Result<T, AttestationsError>;

impl From<AttestationsError> for WasmError {
    fn from(c: AttestationsError) -> Self {
        wasm_error!(WasmErrorInner::Guest(c.to_string()))
    }
}
