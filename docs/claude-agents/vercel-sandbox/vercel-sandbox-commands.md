# Vercel Sandbox Docs

## Docs

- [Class - Command](https://vercel-sandbox.mintlify.app/docs/vercel-sandbox/reference/classes/command.md)
- [Class - CommandFinished](https://vercel-sandbox.mintlify.app/docs/vercel-sandbox/reference/classes/commandfinished.md)
- [Class - Sandbox](https://vercel-sandbox.mintlify.app/docs/vercel-sandbox/reference/classes/sandbox.md)
- [@vercel/sandbox](https://vercel-sandbox.mintlify.app/docs/vercel-sandbox/reference/globals.md)
- [Vercel Sandbox](https://vercel-sandbox.mintlify.app/docs/vercel-sandbox/reference/readme.md)
# Class - Command

A command executed in a Sandbox.

For detached commands, you can [wait](#wait) to get a [CommandFinished](/docs/vercel-sandbox/reference/classes/commandfinished) instance
with the populated exit code. For non-detached commands, [Sandbox.runCommand](/docs/vercel-sandbox/reference/classes/sandbox#runcommand)
automatically waits and returns a [CommandFinished](/docs/vercel-sandbox/reference/classes/commandfinished) instance.

You can iterate over command output with [logs](#logs).

## See

[Sandbox.runCommand](/docs/vercel-sandbox/reference/classes/sandbox#runcommand) to start a command.

## Extended by

* [`CommandFinished`](/docs/vercel-sandbox/reference/classes/commandfinished)

## Properties

### exitCode

```ts  theme={"system"}
exitCode: null | number;
```

## Accessors

### cmdId

#### Get Signature

```ts  theme={"system"}
get cmdId(): string;
```

ID of the command execution.

##### Returns

`string`

***

### cwd

#### Get Signature

```ts  theme={"system"}
get cwd(): string;
```

##### Returns

`string`

***

### startedAt

#### Get Signature

```ts  theme={"system"}
get startedAt(): number;
```

##### Returns

`number`

## Methods

### logs()

```ts  theme={"system"}
logs(opts?: {
  signal?: AbortSignal;
}): AsyncGenerator<{
  stream: "stdout" | "stderr";
  data: string;
}, void, void> & Disposable & {
  close: void;
};
```

Iterate over the output of this command.

```ts  theme={"system"}
for await (const log of cmd.logs()) {
  if (log.stream === "stdout") {
    process.stdout.write(log.data);
  } else {
    process.stderr.write(log.data);
  }
}
```

#### Parameters

| Parameter      | Type                           | Description                             |
| -------------- | ------------------------------ | --------------------------------------- |
| `opts?`        | \{ `signal?`: `AbortSignal`; } | Optional parameters.                    |
| `opts.signal?` | `AbortSignal`                  | An AbortSignal to cancel log streaming. |

#### Returns

`AsyncGenerator`\<\{
`stream`: `"stdout"` | `"stderr"`;
`data`: `string`;
}, `void`, `void`> & `Disposable` & \{
`close`: `void`;
}

An async iterable of log entries from the command output.

#### See

[Command.stdout](#stdout), [Command.stderr](#stderr), and [Command.output](#output)
to access output as a string.

***

### wait()

```ts  theme={"system"}
wait(params?: {
  signal?: AbortSignal;
}): Promise<CommandFinished>;
```

Wait for a command to exit and populate its exit code.

This method is useful for detached commands where you need to wait
for completion. For non-detached commands, [Sandbox.runCommand](/docs/vercel-sandbox/reference/classes/sandbox#runcommand)
automatically waits and returns a [CommandFinished](/docs/vercel-sandbox/reference/classes/commandfinished) instance.

```ts  theme={"system"}
const detachedCmd = await sandbox.runCommand({
  cmd: "sleep",
  args: ["5"],
  detached: true,
});
const result = await detachedCmd.wait();
if (result.exitCode !== 0) {
  console.error("Something went wrong...");
}
```

#### Parameters

| Parameter        | Type                           | Description                       |
| ---------------- | ------------------------------ | --------------------------------- |
| `params?`        | \{ `signal?`: `AbortSignal`; } | Optional parameters.              |
| `params.signal?` | `AbortSignal`                  | An AbortSignal to cancel waiting. |

#### Returns

`Promise`\<[`CommandFinished`](/docs/vercel-sandbox/reference/classes/commandfinished)>

A [CommandFinished](/docs/vercel-sandbox/reference/classes/commandfinished) instance with populated exit code.

***

### output()

```ts  theme={"system"}
output(stream: "stdout" | "stderr" | "both", opts?: {
  signal?: AbortSignal;
}): Promise<string>;
```

Get the output of `stdout`, `stderr`, or both as a string.

NOTE: This may throw string conversion errors if the command does
not output valid Unicode.

#### Parameters

| Parameter      | Type                                 | Default value | Description                                               |
| -------------- | ------------------------------------ | ------------- | --------------------------------------------------------- |
| `stream`       | `"stdout"` \| `"stderr"` \| `"both"` | `"both"`      | The output stream to read: "stdout", "stderr", or "both". |
| `opts?`        | \{ `signal?`: `AbortSignal`; }       | `undefined`   | Optional parameters.                                      |
| `opts.signal?` | `AbortSignal`                        | `undefined`   | An AbortSignal to cancel output streaming.                |

#### Returns

`Promise`\<`string`>

The output of the specified stream(s) as a string.

***

### stdout()

```ts  theme={"system"}
stdout(opts?: {
  signal?: AbortSignal;
}): Promise<string>;
```

Get the output of `stdout` as a string.

NOTE: This may throw string conversion errors if the command does
not output valid Unicode.

#### Parameters

| Parameter      | Type                           | Description                                |
| -------------- | ------------------------------ | ------------------------------------------ |
| `opts?`        | \{ `signal?`: `AbortSignal`; } | Optional parameters.                       |
| `opts.signal?` | `AbortSignal`                  | An AbortSignal to cancel output streaming. |

#### Returns

`Promise`\<`string`>

The standard output of the command.

***

### stderr()

```ts  theme={"system"}
stderr(opts?: {
  signal?: AbortSignal;
}): Promise<string>;
```

Get the output of `stderr` as a string.

NOTE: This may throw string conversion errors if the command does
not output valid Unicode.

#### Parameters

| Parameter      | Type                           | Description                                |
| -------------- | ------------------------------ | ------------------------------------------ |
| `opts?`        | \{ `signal?`: `AbortSignal`; } | Optional parameters.                       |
| `opts.signal?` | `AbortSignal`                  | An AbortSignal to cancel output streaming. |

#### Returns

`Promise`\<`string`>

The standard error output of the command.

***

### kill()

```ts  theme={"system"}
kill(signal?: Signal, opts?: {
  abortSignal?: AbortSignal;
}): Promise<void>;
```

Kill a running command in a sandbox.

#### Parameters

| Parameter           | Type                                | Description                                                  |
| ------------------- | ----------------------------------- | ------------------------------------------------------------ |
| `signal?`           | `Signal`                            | The signal to send the running process. Defaults to SIGTERM. |
| `opts?`             | \{ `abortSignal?`: `AbortSignal`; } | Optional parameters.                                         |
| `opts.abortSignal?` | `AbortSignal`                       | An AbortSignal to cancel the kill operation.                 |

#### Returns

`Promise`\<`void`>

`Promise<void>`.


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://vercel-sandbox.mintlify.app/llms.txt

------

# Class - CommandFinished

A command that has finished executing.

The exit code is immediately available and populated upon creation.
Unlike [Command](/docs/vercel-sandbox/reference/classes/command), you don't need to call wait() - the command
has already completed execution.

## Extends

* [`Command`](/docs/vercel-sandbox/reference/classes/command)

## Properties

### exitCode

```ts  theme={"system"}
exitCode: number;
```

The exit code of the command. This is always populated for
CommandFinished instances.

#### Overrides

[`Command`](/docs/vercel-sandbox/reference/classes/command).[`exitCode`](/docs/vercel-sandbox/reference/classes/command#exitcode)

## Accessors

### cmdId

#### Get Signature

```ts  theme={"system"}
get cmdId(): string;
```

ID of the command execution.

##### Returns

`string`

#### Inherited from

[`Command`](/docs/vercel-sandbox/reference/classes/command).[`cmdId`](/docs/vercel-sandbox/reference/classes/command#cmdid)

***

### cwd

#### Get Signature

```ts  theme={"system"}
get cwd(): string;
```

##### Returns

`string`

#### Inherited from

[`Command`](/docs/vercel-sandbox/reference/classes/command).[`cwd`](/docs/vercel-sandbox/reference/classes/command#cwd)

***

### startedAt

#### Get Signature

```ts  theme={"system"}
get startedAt(): number;
```

##### Returns

`number`

#### Inherited from

[`Command`](/docs/vercel-sandbox/reference/classes/command).[`startedAt`](/docs/vercel-sandbox/reference/classes/command#startedat)

## Methods

### logs()

```ts  theme={"system"}
logs(opts?: {
  signal?: AbortSignal;
}): AsyncGenerator<{
  stream: "stdout" | "stderr";
  data: string;
}, void, void> & Disposable & {
  close: void;
};
```

Iterate over the output of this command.

```ts  theme={"system"}
for await (const log of cmd.logs()) {
  if (log.stream === "stdout") {
    process.stdout.write(log.data);
  } else {
    process.stderr.write(log.data);
  }
}
```

#### Parameters

| Parameter      | Type                           | Description                             |
| -------------- | ------------------------------ | --------------------------------------- |
| `opts?`        | \{ `signal?`: `AbortSignal`; } | Optional parameters.                    |
| `opts.signal?` | `AbortSignal`                  | An AbortSignal to cancel log streaming. |

#### Returns

`AsyncGenerator`\<\{
`stream`: `"stdout"` | `"stderr"`;
`data`: `string`;
}, `void`, `void`> & `Disposable` & \{
`close`: `void`;
}

An async iterable of log entries from the command output.

#### See

[Command.stdout](/docs/vercel-sandbox/reference/classes/command#stdout), [Command.stderr](/docs/vercel-sandbox/reference/classes/command#stderr), and [Command.output](/docs/vercel-sandbox/reference/classes/command#output)
to access output as a string.

#### Inherited from

[`Command`](/docs/vercel-sandbox/reference/classes/command).[`logs`](/docs/vercel-sandbox/reference/classes/command#logs)

***

### output()

```ts  theme={"system"}
output(stream: "stdout" | "stderr" | "both", opts?: {
  signal?: AbortSignal;
}): Promise<string>;
```

Get the output of `stdout`, `stderr`, or both as a string.

NOTE: This may throw string conversion errors if the command does
not output valid Unicode.

#### Parameters

| Parameter      | Type                                 | Default value | Description                                               |
| -------------- | ------------------------------------ | ------------- | --------------------------------------------------------- |
| `stream`       | `"stdout"` \| `"stderr"` \| `"both"` | `"both"`      | The output stream to read: "stdout", "stderr", or "both". |
| `opts?`        | \{ `signal?`: `AbortSignal`; }       | `undefined`   | Optional parameters.                                      |
| `opts.signal?` | `AbortSignal`                        | `undefined`   | An AbortSignal to cancel output streaming.                |

#### Returns

`Promise`\<`string`>

The output of the specified stream(s) as a string.

#### Inherited from

[`Command`](/docs/vercel-sandbox/reference/classes/command).[`output`](/docs/vercel-sandbox/reference/classes/command#output)

***

### stdout()

```ts  theme={"system"}
stdout(opts?: {
  signal?: AbortSignal;
}): Promise<string>;
```

Get the output of `stdout` as a string.

NOTE: This may throw string conversion errors if the command does
not output valid Unicode.

#### Parameters

| Parameter      | Type                           | Description                                |
| -------------- | ------------------------------ | ------------------------------------------ |
| `opts?`        | \{ `signal?`: `AbortSignal`; } | Optional parameters.                       |
| `opts.signal?` | `AbortSignal`                  | An AbortSignal to cancel output streaming. |

#### Returns

`Promise`\<`string`>

The standard output of the command.

#### Inherited from

[`Command`](/docs/vercel-sandbox/reference/classes/command).[`stdout`](/docs/vercel-sandbox/reference/classes/command#stdout)

***

### stderr()

```ts  theme={"system"}
stderr(opts?: {
  signal?: AbortSignal;
}): Promise<string>;
```

Get the output of `stderr` as a string.

NOTE: This may throw string conversion errors if the command does
not output valid Unicode.

#### Parameters

| Parameter      | Type                           | Description                                |
| -------------- | ------------------------------ | ------------------------------------------ |
| `opts?`        | \{ `signal?`: `AbortSignal`; } | Optional parameters.                       |
| `opts.signal?` | `AbortSignal`                  | An AbortSignal to cancel output streaming. |

#### Returns

`Promise`\<`string`>

The standard error output of the command.

#### Inherited from

[`Command`](/docs/vercel-sandbox/reference/classes/command).[`stderr`](/docs/vercel-sandbox/reference/classes/command#stderr)

***

### kill()

```ts  theme={"system"}
kill(signal?: Signal, opts?: {
  abortSignal?: AbortSignal;
}): Promise<void>;
```

Kill a running command in a sandbox.

#### Parameters

| Parameter           | Type                                | Description                                                  |
| ------------------- | ----------------------------------- | ------------------------------------------------------------ |
| `signal?`           | `Signal`                            | The signal to send the running process. Defaults to SIGTERM. |
| `opts?`             | \{ `abortSignal?`: `AbortSignal`; } | Optional parameters.                                         |
| `opts.abortSignal?` | `AbortSignal`                       | An AbortSignal to cancel the kill operation.                 |

#### Returns

`Promise`\<`void`>

`Promise<void>`.

#### Inherited from

[`Command`](/docs/vercel-sandbox/reference/classes/command).[`kill`](/docs/vercel-sandbox/reference/classes/command#kill)

***

### ~~wait()~~

```ts  theme={"system"}
wait(): Promise<CommandFinished>;
```

The wait method is not needed for CommandFinished instances since
the command has already completed and exitCode is populated.

#### Returns

`Promise`\<`CommandFinished`>

This CommandFinished instance.

#### Deprecated

This method is redundant for CommandFinished instances.
The exitCode is already available.

#### Overrides

[`Command`](/docs/vercel-sandbox/reference/classes/command).[`wait`](/docs/vercel-sandbox/reference/classes/command#wait)


---

# Class - Sandbox

A Sandbox is an isolated Linux MicroVM to run commands in.

Use [Sandbox.create](#create) or [Sandbox.get](#get) to construct.

## Accessors

### sandboxId

#### Get Signature

```ts  theme={"system"}
get sandboxId(): string;
```

Unique ID of this sandbox.

##### Returns

`string`

***

### status

#### Get Signature

```ts  theme={"system"}
get status(): "pending" | "running" | "stopping" | "stopped" | "failed";
```

The status of the sandbox.

##### Returns

`"pending"` | `"running"` | `"stopping"` | `"stopped"` | `"failed"`

***

### timeout

#### Get Signature

```ts  theme={"system"}
get timeout(): number;
```

The timeout of the sandbox in milliseconds.

##### Returns

`number`

## Methods

### list()

```ts  theme={"system"}
static list(params: {
  projectId: string;
  limit?: number;
  since?: number | Date;
  until?: number | Date;
  signal?: AbortSignal;
} & Partial<Credentials>): Promise<Parsed<{
  sandboxes: {
     id: string;
     memory: number;
     vcpus: number;
     region: string;
     runtime: string;
     timeout: number;
     status: "pending" | "running" | "stopping" | "stopped" | "failed";
     requestedAt: number;
     startedAt?: number;
     requestedStopAt?: number;
     stoppedAt?: number;
     duration?: number;
     createdAt: number;
     cwd: string;
     updatedAt: number;
  }[];
  pagination: {
     count: number;
     next: null | number;
     prev: null | number;
  };
}>>;
```

Allow to get a list of sandboxes for a team narrowed to the given params.
It returns both the sandboxes and the pagination metadata to allow getting
the next page of results.

#### Parameters

| Parameter | Type                                                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `params`  | \{ `projectId`: `string`; `limit?`: `number`; `since?`: `number` \| `Date`; `until?`: `number` \| `Date`; `signal?`: `AbortSignal`; } & `Partial`\<`Credentials`> |

#### Returns

`Promise`\<`Parsed`\<\{
`sandboxes`: \{
`id`: `string`;
`memory`: `number`;
`vcpus`: `number`;
`region`: `string`;
`runtime`: `string`;
`timeout`: `number`;
`status`: `"pending"` | `"running"` | `"stopping"` | `"stopped"` | `"failed"`;
`requestedAt`: `number`;
`startedAt?`: `number`;
`requestedStopAt?`: `number`;
`stoppedAt?`: `number`;
`duration?`: `number`;
`createdAt`: `number`;
`cwd`: `string`;
`updatedAt`: `number`;
}\[];
`pagination`: \{
`count`: `number`;
`next`: `null` | `number`;
`prev`: `null` | `number`;
};
}>>

***

### create()

```ts  theme={"system"}
static create(params?: WithPrivate<
  | {
  source?:   | {
     type: "git";
     url: string;
     depth?: number;
     revision?: string;
   }
     | {
     type: "git";
     url: string;
     username: string;
     password: string;
     depth?: number;
     revision?: string;
   }
     | {
     type: "tarball";
     url: string;
   };
  ports?: number[];
  timeout?: number;
  resources?: {
     vcpus: number;
  };
  runtime?:   | string & {
   }
     | "node22"
     | "python3.13";
  signal?: AbortSignal;
}
  | {
  source?:   | {
     type: "git";
     url: string;
     depth?: number;
     revision?: string;
   }
     | {
     type: "git";
     url: string;
     username: string;
     password: string;
     depth?: number;
     revision?: string;
   }
     | {
     type: "tarball";
     url: string;
   };
  ports?: number[];
  timeout?: number;
  resources?: {
     vcpus: number;
  };
  runtime?:   | string & {
   }
     | "node22"
     | "python3.13";
  signal?: AbortSignal;
} & Credentials>): Promise<Sandbox>;
```

Create a new sandbox.

#### Parameters

| Parameter | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Description                                   |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `params?` | `WithPrivate`\< \| \{ `source?`: \| \{ `type`: `"git"`; `url`: `string`; `depth?`: `number`; `revision?`: `string`; } \| \{ `type`: `"git"`; `url`: `string`; `username`: `string`; `password`: `string`; `depth?`: `number`; `revision?`: `string`; } \| \{ `type`: `"tarball"`; `url`: `string`; }; `ports?`: `number`\[]; `timeout?`: `number`; `resources?`: \{ `vcpus`: `number`; }; `runtime?`: \| `string` & \{ } \| `"node22"` \| `"python3.13"`; `signal?`: `AbortSignal`; } \| \{ `source?`: \| \{ `type`: `"git"`; `url`: `string`; `depth?`: `number`; `revision?`: `string`; } \| \{ `type`: `"git"`; `url`: `string`; `username`: `string`; `password`: `string`; `depth?`: `number`; `revision?`: `string`; } \| \{ `type`: `"tarball"`; `url`: `string`; }; `ports?`: `number`\[]; `timeout?`: `number`; `resources?`: \{ `vcpus`: `number`; }; `runtime?`: \| `string` & \{ } \| `"node22"` \| `"python3.13"`; `signal?`: `AbortSignal`; } & `Credentials`> | Creation parameters and optional credentials. |

#### Returns

`Promise`\<`Sandbox`>

A promise resolving to the created Sandbox.

***

### get()

```ts  theme={"system"}
static get(params:
  | {
  sandboxId: string;
  signal?: AbortSignal;
}
  | {
  sandboxId: string;
  signal?: AbortSignal;
} & Credentials): Promise<Sandbox>;
```

Retrieve an existing sandbox.

#### Parameters

| Parameter | Type                                                                                                                              | Description                              |
| --------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `params`  | \| \{ `sandboxId`: `string`; `signal?`: `AbortSignal`; } \| \{ `sandboxId`: `string`; `signal?`: `AbortSignal`; } & `Credentials` | Get parameters and optional credentials. |

#### Returns

`Promise`\<`Sandbox`>

A promise resolving to the Sandbox.

***

### getCommand()

```ts  theme={"system"}
getCommand(cmdId: string, opts?: {
  signal?: AbortSignal;
}): Promise<Command>;
```

Get a previously run command by its ID.

#### Parameters

| Parameter      | Type                           | Description                             |
| -------------- | ------------------------------ | --------------------------------------- |
| `cmdId`        | `string`                       | ID of the command to retrieve           |
| `opts?`        | \{ `signal?`: `AbortSignal`; } | Optional parameters.                    |
| `opts.signal?` | `AbortSignal`                  | An AbortSignal to cancel the operation. |

#### Returns

`Promise`\<[`Command`](/docs/vercel-sandbox/reference/classes/command)>

A [Command](/docs/vercel-sandbox/reference/classes/command) instance representing the command

***

### runCommand()

#### Call Signature

```ts  theme={"system"}
runCommand(
   command: string,
   args?: string[],
   opts?: {
  signal?: AbortSignal;
}): Promise<CommandFinished>;
```

Start executing a command in this sandbox.

##### Parameters

| Parameter      | Type                           | Description                                     |
| -------------- | ------------------------------ | ----------------------------------------------- |
| `command`      | `string`                       | The command to execute.                         |
| `args?`        | `string`\[]                    | Arguments to pass to the command.               |
| `opts?`        | \{ `signal?`: `AbortSignal`; } | Optional parameters.                            |
| `opts.signal?` | `AbortSignal`                  | An AbortSignal to cancel the command execution. |

##### Returns

`Promise`\<[`CommandFinished`](/docs/vercel-sandbox/reference/classes/commandfinished)>

A [CommandFinished](/docs/vercel-sandbox/reference/classes/commandfinished) result once execution is done.

#### Call Signature

```ts  theme={"system"}
runCommand(params: {
  cmd: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  sudo?: boolean;
  detached?: boolean;
  stdout?: Writable;
  stderr?: Writable;
  signal?: AbortSignal;
} & {
  detached: true;
}): Promise<Command>;
```

Start executing a command in detached mode.

##### Parameters

| Parameter | Type                                                                                                                                                                                                                                                | Description             |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `params`  | \{ `cmd`: `string`; `args?`: `string`\[]; `cwd?`: `string`; `env?`: `Record`\<`string`, `string`>; `sudo?`: `boolean`; `detached?`: `boolean`; `stdout?`: `Writable`; `stderr?`: `Writable`; `signal?`: `AbortSignal`; } & \{ `detached`: `true`; } | The command parameters. |

##### Returns

`Promise`\<[`Command`](/docs/vercel-sandbox/reference/classes/command)>

A [Command](/docs/vercel-sandbox/reference/classes/command) instance for the running command.

#### Call Signature

```ts  theme={"system"}
runCommand(params: {
  cmd: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  sudo?: boolean;
  detached?: boolean;
  stdout?: Writable;
  stderr?: Writable;
  signal?: AbortSignal;
}): Promise<CommandFinished>;
```

Start executing a command in this sandbox.

##### Parameters

| Parameter          | Type                                                                                                                                                                                                                     | Description                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `params`           | \{ `cmd`: `string`; `args?`: `string`\[]; `cwd?`: `string`; `env?`: `Record`\<`string`, `string`>; `sudo?`: `boolean`; `detached?`: `boolean`; `stdout?`: `Writable`; `stderr?`: `Writable`; `signal?`: `AbortSignal`; } | The command parameters.                                                |
| `params.cmd`       | `string`                                                                                                                                                                                                                 | The command to execute                                                 |
| `params.args?`     | `string`\[]                                                                                                                                                                                                              | Arguments to pass to the command                                       |
| `params.cwd?`      | `string`                                                                                                                                                                                                                 | Working directory to execute the command in                            |
| `params.env?`      | `Record`\<`string`, `string`>                                                                                                                                                                                            | Environment variables to set for this command                          |
| `params.sudo?`     | `boolean`                                                                                                                                                                                                                | If true, execute this command with root privileges. Defaults to false. |
| `params.detached?` | `boolean`                                                                                                                                                                                                                | If true, the command will return without waiting for `exitCode`        |
| `params.stdout?`   | `Writable`                                                                                                                                                                                                               | A `Writable` stream where `stdout` from the command will be piped      |
| `params.stderr?`   | `Writable`                                                                                                                                                                                                               | A `Writable` stream where `stderr` from the command will be piped      |
| `params.signal?`   | `AbortSignal`                                                                                                                                                                                                            | An AbortSignal to cancel the command execution                         |

##### Returns

`Promise`\<[`CommandFinished`](/docs/vercel-sandbox/reference/classes/commandfinished)>

A [CommandFinished](/docs/vercel-sandbox/reference/classes/commandfinished) result once execution is done.

***

### \_runCommand()

```ts  theme={"system"}
_runCommand(params: {
  cmd: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  sudo?: boolean;
  detached?: boolean;
  stdout?: Writable;
  stderr?: Writable;
  signal?: AbortSignal;
}): Promise<Command | CommandFinished>;
```

**`Internal`**

Internal helper to start a command in the sandbox.

#### Parameters

| Parameter          | Type                                                                                                                                                                                                                     | Description                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `params`           | \{ `cmd`: `string`; `args?`: `string`\[]; `cwd?`: `string`; `env?`: `Record`\<`string`, `string`>; `sudo?`: `boolean`; `detached?`: `boolean`; `stdout?`: `Writable`; `stderr?`: `Writable`; `signal?`: `AbortSignal`; } | Command execution parameters.                                          |
| `params.cmd`       | `string`                                                                                                                                                                                                                 | The command to execute                                                 |
| `params.args?`     | `string`\[]                                                                                                                                                                                                              | Arguments to pass to the command                                       |
| `params.cwd?`      | `string`                                                                                                                                                                                                                 | Working directory to execute the command in                            |
| `params.env?`      | `Record`\<`string`, `string`>                                                                                                                                                                                            | Environment variables to set for this command                          |
| `params.sudo?`     | `boolean`                                                                                                                                                                                                                | If true, execute this command with root privileges. Defaults to false. |
| `params.detached?` | `boolean`                                                                                                                                                                                                                | If true, the command will return without waiting for `exitCode`        |
| `params.stdout?`   | `Writable`                                                                                                                                                                                                               | A `Writable` stream where `stdout` from the command will be piped      |
| `params.stderr?`   | `Writable`                                                                                                                                                                                                               | A `Writable` stream where `stderr` from the command will be piped      |
| `params.signal?`   | `AbortSignal`                                                                                                                                                                                                            | An AbortSignal to cancel the command execution                         |

#### Returns

`Promise`\<[`Command`](/docs/vercel-sandbox/reference/classes/command) | [`CommandFinished`](/docs/vercel-sandbox/reference/classes/commandfinished)>

A [Command](/docs/vercel-sandbox/reference/classes/command) or [CommandFinished](/docs/vercel-sandbox/reference/classes/commandfinished), depending on `detached`.

***

### mkDir()

```ts  theme={"system"}
mkDir(path: string, opts?: {
  signal?: AbortSignal;
}): Promise<void>;
```

Create a directory in the filesystem of this sandbox.

#### Parameters

| Parameter      | Type                           | Description                             |
| -------------- | ------------------------------ | --------------------------------------- |
| `path`         | `string`                       | Path of the directory to create         |
| `opts?`        | \{ `signal?`: `AbortSignal`; } | Optional parameters.                    |
| `opts.signal?` | `AbortSignal`                  | An AbortSignal to cancel the operation. |

#### Returns

`Promise`\<`void`>

***

### readFile()

```ts  theme={"system"}
readFile(file: {
  path: string;
  cwd?: string;
}, opts?: {
  signal?: AbortSignal;
}): Promise<null | ReadableStream>;
```

Read a file from the filesystem of this sandbox.

#### Parameters

| Parameter      | Type                                     | Description                              |
| -------------- | ---------------------------------------- | ---------------------------------------- |
| `file`         | \{ `path`: `string`; `cwd?`: `string`; } | File to read, with path and optional cwd |
| `file.path`    | `string`                                 | -                                        |
| `file.cwd?`    | `string`                                 | -                                        |
| `opts?`        | \{ `signal?`: `AbortSignal`; }           | Optional parameters.                     |
| `opts.signal?` | `AbortSignal`                            | An AbortSignal to cancel the operation.  |

#### Returns

`Promise`\<`null` | `ReadableStream`>

A promise that resolves to a ReadableStream containing the file contents

***

### writeFiles()

```ts  theme={"system"}
writeFiles(files: {
  path: string;
  content: Buffer;
}[], opts?: {
  signal?: AbortSignal;
}): Promise<void>;
```

Write files to the filesystem of this sandbox.
Defaults to writing to /vercel/sandbox unless an absolute path is specified.
Writes files using the `vercel-sandbox` user.

#### Parameters

| Parameter      | Type                                           | Description                                         |
| -------------- | ---------------------------------------------- | --------------------------------------------------- |
| `files`        | \{ `path`: `string`; `content`: `Buffer`; }\[] | Array of files with path and stream/buffer contents |
| `opts?`        | \{ `signal?`: `AbortSignal`; }                 | Optional parameters.                                |
| `opts.signal?` | `AbortSignal`                                  | An AbortSignal to cancel the operation.             |

#### Returns

`Promise`\<`void`>

A promise that resolves when the files are written

***

### domain()

```ts  theme={"system"}
domain(p: number): string;
```

Get the public domain of a port of this sandbox.

#### Parameters

| Parameter | Type     | Description            |
| --------- | -------- | ---------------------- |
| `p`       | `number` | Port number to resolve |

#### Returns

`string`

A full domain (e.g. `https://subdomain.vercel.run`)

#### Throws

If the port has no associated route

***

### stop()

```ts  theme={"system"}
stop(opts?: {
  signal?: AbortSignal;
}): Promise<void>;
```

Stop the sandbox.

#### Parameters

| Parameter      | Type                           | Description                             |
| -------------- | ------------------------------ | --------------------------------------- |
| `opts?`        | \{ `signal?`: `AbortSignal`; } | Optional parameters.                    |
| `opts.signal?` | `AbortSignal`                  | An AbortSignal to cancel the operation. |

#### Returns

`Promise`\<`void`>

A promise that resolves when the sandbox is stopped

***

### extendTimeout()

```ts  theme={"system"}
extendTimeout(duration: number, opts?: {
  signal?: AbortSignal;
}): Promise<void>;
```

Extend the timeout of the sandbox by the specified duration.

This allows you to extend the lifetime of a sandbox up until the maximum
execution timeout for your plan.

#### Parameters

| Parameter      | Type                           | Description                                           |
| -------------- | ------------------------------ | ----------------------------------------------------- |
| `duration`     | `number`                       | The duration in milliseconds to extend the timeout by |
| `opts?`        | \{ `signal?`: `AbortSignal`; } | Optional parameters.                                  |
| `opts.signal?` | `AbortSignal`                  | An AbortSignal to cancel the operation.               |

#### Returns

`Promise`\<`void`>

A promise that resolves when the timeout is extended


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://vercel-sandbox.mintlify.app/llms.txt