# Using Vercel Sandbox to run Claude’s Agent SDK
Last updated November 25, 2025
By Ismael Rumzan

---

## [Why use a sandbox environment](#why-use-a-sandbox-environment)

The [Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk/overview) operates as a long-running process that executes commands, manages files, and maintains conversational state. Because the SDK runs shell commands and modifies files on behalf of the AI agent, its important to isolate it in a sandboxed container. This prevents the agent from accessing your production systems, consuming unlimited resources, or interfering with other processes.

The SDK needs specific runtime dependencies installed before it can run:

*   Claude Code CLI: Executes commands and manages the development environment
*   Anthropic SDK: Provides the API client for Claude Code

[Vercel Sandbox](https://vercel.com/docs/vercel-sandbox) provides an ephemeral space with security, customization for dependencies, resource limits and isolation.

This guide shows you how to install the Claude Agent dependencies in a Vercel Sandbox and verify they work correctly before building your agent application.

## [Prerequisites](#prerequisites)

Before you begin, make sure you have:

*   Vercel CLI installed on your machine. If you don't have it, install it with `npm install -g vercel`
*   Node.js 22 or later installed locally
*   A [Vercel project](https://vercel.com/docs/projects) to link your sandbox to

## [1\. Project Setup](#1.-project-setup)

Create a new directory for your project and set up the required files:

```
1mkdir claude-sandbox-demo2cd claude-sandbox-demo3npm init -y4npm install @vercel/sandbox ms5npm install -D @types/ms @types/node
```

The packages you installed:

*   `@vercel/sandbox`: Vercel's SDK for creating and managing sandboxes
*   `ms`: Helper for working with time durations
*   Type definitions for TypeScript support

Update your `package.json` to enable ES modules by adding `"type": "module"`:

```
1{2  "name": "claude-sandbox-demo",3  "type": "module",4  "dependencies": {5    "@vercel/sandbox": "^1.0.2",6    "ms": "^2.1.3"7  },8  "devDependencies": {9    "@types/ms": "^2.1.0",10    "@types/node": "^24.10.0"11  }12}
```

Create a `tsconfig.json` file for TypeScript configuration:

```
1{2  "compilerOptions": {3    "module": "ES2022",4    "moduleResolution": "node",5    "esModuleInterop": true,6    "types": ["node"]7  }8}
```

Link your project to Vercel:

```
1vercel link
```

This command connects your local project to a new or existing Vercel project, which is required for sandbox authentication.

## [2\. Set Up Authentication](#2.-set-up-authentication)

To securely connect your Vercel deployment with your sandbox, you can use the [Vercel OIDC token](https://vercel.com/docs/oidc) automatically created with a project. Pull the authentication token to your local `.env.local` file:

```
1vercel env pull
```

This creates a `.env.local` file with a `VERCEL_OIDC_TOKEN` that the Vercel Sandbox SDK uses for authentication. The OIDC token expires after 12 hours, so you'll need to run `vercel env pull` again if you're developing for extended periods.

## [3\. Create the Installation Script](#3.-create-the-installation-script)

Create a new file called `claude-sandbox.ts` that sets up a Vercel Sandbox, installs both Claude Code CLI and the Anthropic SDK, and verifies the installation:

```
1import ms from 'ms';2import { Sandbox } from '@vercel/sandbox';3async function main() {4  const sandbox = await Sandbox.create({5    resources: { vcpus: 4 },6    // Timeout in milliseconds: ms('10m') = 6000007    // Defaults to 5 minutes. The maximum is 5 hours for Pro/Enterprise, and 45 minutes for Hobby.8    timeout: ms('10m'),9    runtime: 'node22',10  });11  console.log(`Sandbox created: ${sandbox.sandboxId}`);12  console.log(`Installing Claude Code CLI...`);13  // Install Claude Code CLI globally14  const installCLI = await sandbox.runCommand({15    cmd: 'npm',16    args: ['install', '-g', '@anthropic-ai/claude-code'],17    stderr: process.stderr,18    stdout: process.stdout,19    sudo: true,20  });21  if (installCLI.exitCode != 0) {22    console.log('installing Claude Code CLI failed');23    process.exit(1);24  }25  console.log(`✓ Claude Code CLI installed`);26  console.log(`Installing Anthropic SDK...`);27  // Install @anthropic-ai/sdk in the working directory28  const installSDK = await sandbox.runCommand({29    cmd: 'npm',30    args: ['install', '@anthropic-ai/sdk'],31    stderr: process.stderr,32    stdout: process.stdout,33  });34  if (installSDK.exitCode != 0) {35    console.log('installing Anthropic SDK failed');36    process.exit(1);37  }38  console.log(`✓ Anthropic SDK installed`);39  console.log(`Verifying SDK connection...`);40  // Create a simple script to verify the SDK can be imported41  const verifyScript = `42import Anthropic from '@anthropic-ai/sdk';43console.log('SDK imported successfully');44console.log('Anthropic SDK version:', Anthropic.VERSION);45console.log('SDK is ready to use');46`;47  await sandbox.writeFiles([48    {49      path: '/vercel/sandbox/verify.mjs',50      content: Buffer.from(verifyScript),51    },52  ]);53  // Run the verification script54  const verifyRun = await sandbox.runCommand({55    cmd: 'node',56    args: ['verify.mjs'],57    stderr: process.stderr,58    stdout: process.stdout,59  });60  if (verifyRun.exitCode != 0) {61    console.log('SDK verification failed');62    process.exit(1);63  }64  console.log(`✓ Anthropic SDK is properly connected`);65  console.log(`\\nSuccess! Both Claude Code CLI and Anthropic SDK are installed and ready to use.`);66  // Stop the sandbox67  await sandbox.stop();68  console.log(`Sandbox stopped`);69}70main().catch(console.error);71
72
```

### [What the script does](#what-the-script-does)

1.  Creates a sandbox with 4 vCPUs and a 10-minute timeout
2.  Installs Claude Code CLI globally using `sudo` for system-level access
3.  Installs the Anthropic SDK in the working directory
4.  Writes a verification script to the sandbox filesystem using `writeFiles()`with a Buffer
5.  Runs the verification to confirm the SDK is properly connected
6.  Stops the sandbox when complete

### [Script reference information](#script-reference-information)

*   Uses `sandbox.sandboxId` to access the unique sandbox identifier
*   Checks exit codes with `!= 0` for command failures
*   Uses `writeFiles()`which accepts an array of file objects with `content` as a Buffer
*   Streams output to `process.stderr` and `process.stdout` for real-time feedback

## [4\. Run the Verification](#4.-run-the-verification)

Run your script with the environment variables from `.env.local`:

```
1node --env-file .env.local --experimental-strip-types ./claude-sandbox.ts
```

The output should look similar to this:

```
1Sandbox created: sbx_abc123...2Installing Claude Code CLI...3✓ Claude Code CLI installed4Installing Anthropic SDK...5✓ Anthropic SDK installed6Verifying SDK connection...7SDK imported successfully8Anthropic SDK version: 1.2.39SDK is ready to use10✓ Anthropic SDK is properly connected11Success! Both Claude Code CLI and Anthropic SDK are installed and ready to use.12Sandbox stopped13
```

To monitor your [sandboxes in the Vercel dashboard](https://vercel.com/d?to=%2F%5Bteam%5D%2F%5Bproject%5D%2Fai%2Fsandbox&title=Go+to+your+project+sandboxes):

1.  Navigate to your project on [vercel.com](http://vercel.com)
2.  Click the Observability tab
3.  Click Sandboxes in the left sidebar
4.  View sandbox history, command execution, and resource usage

The script automatically stops the sandbox after verification completes, but you can also manually stop sandboxes from the dashboard if needed.

## [Best Practices](#best-practices)

### [Always stop sandboxes](#always-stop-sandboxes)

Always call `sandbox.stop()` when your work is complete to avoid unnecessary charges:

```
1try {2  // Your sandbox operations3} finally {4  await sandbox.stop();5  console.log('Sandbox stopped');6}
```

### [Set appropriate timeouts](#set-appropriate-timeouts)

Configure timeouts based on your installation requirements. For simple dependency installation, 5-10 minutes is usually sufficient:

```
1const sandbox = await Sandbox.create({2  timeout: ms('10m'), // 10 minutes for installation3  // Maximum: 5 hours for Pro/Enterprise, 45 minutes for Hobby4});
```

## [Next Steps](#next-steps)

Now that you've verified Claude Code CLI and Anthropic SDK work in Vercel Sandbox, you can:

1.  Add API Authentication: Set up your Anthropic API key to enable agent execution
2.  Build AI Features: Use the verified setup to build AI-powered code generation or analysis tools
3.  Scale to Production: Deploy your sandbox-based AI applications

## [Conclusion](#conclusion)

You've successfully installed Claude Code CLI and the Anthropic SDK in a Vercel Sandbox and verified they're properly connected. This setup confirms that your deployment environment can support Claude's Agent SDK.

### [Related Documentation](#related-documentation)

*   [Vercel Sandbox documentation](https://vercel.com/docs/vercel-sandbox)
*   [Vercel Sandbox reference documentation](https://vercel.com/docs/vercel-sandbox/reference/globals) for advanced configuration
*   [Hosting Claude Agent Guide](https://docs.claude.com/en/api/agent-sdk/hosting)
*   [Claude Agent SDK documentation](https://docs.anthropic.com/en/api/agent-sdk) to learn about building AI agents