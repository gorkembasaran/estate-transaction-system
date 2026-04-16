# Design Notes

## Transaction Lifecycle

Transactions always start in the `agreement` stage when they are created. The
create endpoint does not accept an initial stage because the lifecycle should be
driven by explicit transition commands:

```text
agreement -> earnest_money -> title_deed -> completed
```

This keeps the lifecycle traceable and prevents shortcut creation such as
`null -> completed`.

## Agent Selection

`GET /agents` returns only active agents. Inactive agents should not be
selectable for new transactions, while existing transactions can still preserve
their historical agent references.

## Commission Breakdown

The agency always receives 50% of the total service fee. The remaining 50% is
the agent portion.

If the listing agent and selling agent are different people, the agent portion
is split equally between them.

If the listing agent and selling agent are the same person, the full agent
portion is represented once under `listingAgentAmount`, while
`sellingAgentAmount` is `0`. This avoids displaying duplicate payout lines for
the same person and makes the actual amount received by that single agent clear.

## Transaction Reads

Transaction list and detail endpoints populate `listingAgentId` and
`sellingAgentId` with `fullName` and `email`. This keeps frontend screens simple
without duplicating agent data inside the transaction document.
