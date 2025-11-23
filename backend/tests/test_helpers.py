"""
Helper functions for creating test data
"""
from app.models.schemas import Transaction, TransactionInput, TransactionOutput


def create_transaction(
    tx_hash: str = "tx123",
    input_addr: str | None = "1BvBMSEY",
    output_addr: str | None = "1A1zP1eP",
    value: int = 100000000,
    timestamp: int = 1609459200,
    tx_index: int = 123,
    **kwargs
) -> Transaction:
    """Helper to create test transactions with custom parameters
    
    Args:
        tx_hash: Transaction hash
        input_addr: Source address (None for coinbase transactions)
        output_addr: Destination address (None for OP_RETURN outputs)
        value: Amount in satoshis
        timestamp: Unix timestamp
        tx_index: Transaction index
        **kwargs: Additional parameters (ver, fee, size, weight, etc.)
    
    Returns:
        Transaction object configured with the specified parameters
    """
    return Transaction(
        hash=tx_hash,
        ver=kwargs.get("ver", 1),
        vin_sz=kwargs.get("vin_sz", 1),
        vout_sz=kwargs.get("vout_sz", 1),
        size=kwargs.get("size", 250),
        weight=kwargs.get("weight", 1000),
        fee=kwargs.get("fee", 10000),
        relayed_by=kwargs.get("relayed_by", "0.0.0.0"),
        lock_time=kwargs.get("lock_time", 0),
        tx_index=tx_index,
        double_spend=kwargs.get("double_spend", False),
        time=timestamp,
        inputs=[
            TransactionInput(
                sequence=kwargs.get("sequence", 4294967295),
                prev_out={"addr": input_addr, "value": value} if input_addr else None,
                script=kwargs.get("input_script", "script"),
            )
        ],
        out=[
            TransactionOutput(
                type=kwargs.get("output_type", 0),
                spent=kwargs.get("spent", False),
                value=value,
                n=kwargs.get("n", 0),
                tx_index=tx_index,
                script=kwargs.get("output_script", "script"),
                addr=output_addr,
            )
        ],
    )

