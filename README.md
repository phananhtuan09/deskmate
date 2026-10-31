# Deskmate

Deskmate is a Paseo plugin for one person's tasks and for the agent sessions that person chooses to watch.
It reminds you when a task is overdue or a registered session is waiting.
It never sends a prompt, an answer, or a command to an agent.

Paseo 0.11.1 or newer is required.
The plugin runs on the daemon that you install it on, and its screen appears in every Paseo app connected to that daemon.

## Install on another machine

Plugin code is trusted and unsandboxed.
The server side can read files and run programs on the daemon machine.
The screen runs inside the Paseo app.
Install it only from a source you trust.

Turn plugins on once for that daemon, under **Settings → Plugins → Enable plugins**.
Deskmate cannot load while that switch is off.

Install this repository on the daemon machine:

```bash
paseo plugin install git:phananhtuan09/deskmate
```

The same source string can be pasted into **Settings → Plugins → Plugin source**, then **Install plugin**.
`owner/name` without the `git:` prefix installs from the Paseo plugin registry, not from this repository.

To install a checkout you already have, use its full path:

```bash
git clone git@github.com:phananhtuan09/deskmate.git
cd deskmate
paseo plugin install "$PWD"
```

Paseo supplies the plugin SDK, React, and Zod while the plugin runs.
`npm install` is only needed to typecheck or run the tests.

Confirm the plugin:

```bash
paseo plugin ls
```

`deskmate` should be `running` and enabled.
After you change the source, reload it with `paseo plugin reload deskmate`.
Do not restart the daemon to pick up source changes.
`paseo plugin logs deskmate` shows why a load failed.

## Register a session

Deskmate watches only sessions you register.
Open **Deskmate** from the Paseo sidebar.

In the agent you want to watch, submit `/deskmate` in the composer.
That command registers the current agent and does not send the text to the agent.

You can also choose **Register session** in Deskmate and paste that agent's id.
**Unregister** stops observation.
Tasks that were linked to the session stay as they are.

Choose an attention item, or a row in **Registered sessions**, to open that agent.
Dismiss hides one current reminder.
The reminder returns only when a new cause appears.

## Tasks and projects

The board has five columns: Todo, Doing, Done, Pending, and Closed.
A new task starts in Todo.
On a wide desktop window, drag a card to another column to change its status.
On a phone, or a narrow window, use **Move to…**.
**Clear** on Closed deletes every task in that column.

A task can have a note, a project, a due date, and links to registered sessions.
The due date is a calendar day.
If you leave it empty, Deskmate uses the day you created the task.
A task that is still in Todo, Doing, or Pending becomes overdue after that local day ends.

**Projects** stores a name and a full folder path.
**Sync** adds or updates every project Paseo already lists.
It does not delete a project that exists only in Deskmate, and it does not change tasks.

## Where state is stored

Deskmate writes `state.json` under `~/.deskmate` on the daemon machine.
To use another directory, open **Settings → Plugins → Deskmate** and save an absolute path.
An empty path means `~/.deskmate`.
Two daemons must not write the same directory.

## Develop

```bash
npm install
npm test
npm run typecheck
```
