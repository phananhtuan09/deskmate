# Need attention

Status: Active
Scope: Paseo agent sessions the user has registered with Deskmate

## Purpose

When several agent sessions run at once, the user loses track of which one is waiting for them, what they forgot to do, or where an agent went wrong.
Need attention observes only the sessions the user registered and reminds the user, without coordinating the agents.

## Definitions

- Observation: reading a registered session's status, events, and conversation without sending anything to it.
- Attention item: one reason a registered session needs the user.

## Rules

### Registration

- The user MUST be able to register a session by pasting its Paseo agent id.
- The user MUST be able to register the current agent with one action from inside that agent's chat.
- The user MUST be able to unregister a session; Deskmate then stops observing it.
- Deskmate MUST record registered sessions durably.
- Deskmate MUST only observe registered sessions and MUST NOT send prompts, answers, or commands to them.

### Attention items

- Deskmate MUST create an attention item when a registered session:
  - is waiting for a permission decision;
  - had a turn fail or get canceled;
  - was closed or archived.
- Deskmate MUST NOT create an attention item when a turn finishes normally, because the user does not need a reminder for every agent reply.
- An attention item MUST clear automatically when its cause clears, such as the permission being resolved or the user sending a new prompt.
- The user MUST be able to dismiss an attention item.
- Choosing an attention item or a registered session opens that agent in Paseo.
- Opening an agent sends nothing to it.
- Events that happen while Paseo or the plugin is not running MAY be missed; on startup Deskmate MUST refresh each registered session from its current state instead of replaying history.

### Conversation review

- Deskmate MUST remind the user when the conversation in a registered session shows that the user forgot a follow-up or that the agent acted wrongly.
- Conversation review uses a model, so it MUST run only on the user's request or once per ended turn, and MUST NOT run as a continuous loop.
- Conversation review is delivered after the attention items above; the first version ships without it.

## References

- [Product boundary](product-boundary.md)
- [Task board](task-board.md)
