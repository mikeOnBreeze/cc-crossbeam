Vercel Sandbox
Last updated November 21, 2025
Vercel Sandbox is available in Beta on all plans

Vercel Sandbox is an ephemeral compute primitive designed to safely run untrusted or user-generated code on Vercel. It supports dynamic, real-time workloads for AI agents, code generation, and developer experimentation.

With Vercel Sandbox, you can:

Execute untrusted or third-party code: When you need to run code that has not been reviewed, such as AI agent output or user uploads, without exposing your production systems.

Build dynamic, interactive experiences: If you are creating tools that generate or modify code on the fly, such as AI-powered UI builders or developer sandboxes such as language playgrounds.

Test backend logic in isolation: Preview how user-submitted or agent-generated code behaves in a self-contained environment with access to logs, file edits, and live previews.

Run a development server to test your application.

Using Vercel Sandbox
Get started with using Vercel Sandbox with the getting started guide and examples
Learn about authentication methods and the SDK reference
Use the CLI reference to manage sandboxes from the command line
Understand how to monitor your sandboxes
Review pricing, resource limits and system specifications
Getting started
Pre-requisites
The Vercel CLI
Create a sandbox
You can create sandboxes using our TypeScript SDK or Python SDK.

TypeScript
Python
In the steps below, you will create a sandbox with 4 vCPUs that uses node24 runtime to run a Next.js application.

Set up your environment
Create a new directory sandbox-test and install the @vercel/sandbox and ms packages:

Terminal

pnpm i @vercel/sandbox ms
Add the required type definitions for ms and node:

terminal
pnpm add -D @types/ms @types/node
Set up authentication
From the sandbox-test directory you just created, link a new or existing project:

terminal
vercel link
Then pull the project's environment variables:

terminal
vercel env pull
This pulls a Vercel OIDC token into your .env.local file that the SDK will use to authenticate with.

Create the set up file
In the code below, you will:

Clone a Github repository of a Next.js application (Review Using a private repository to clone a private repository)
Install the dependencies for the application
Run a next dev server and listen to port 3000
Open the sandbox URL (sandbox.domain(3000)) in a browser and stream logs to your terminal
The sandbox will stop after the configurable 10 minute timeout.
next-dev.ts
import ms from 'ms';
import { Sandbox } from '@vercel/sandbox';
import { setTimeout } from 'timers/promises';
import { spawn } from 'child_process';
 
async function main() {
  const sandbox = await Sandbox.create({
    source: {
      url: 'https://github.com/vercel/sandbox-example-next.git',
      type: 'git',
    },
    resources: { vcpus: 4 },
    // Timeout in milliseconds: ms('10m') = 600000
    // Defaults to 5 minutes. The maximum is 5 hours for Pro/Enterprise, and 45 minutes for Hobby.
    timeout: ms('10m'),
    ports: [3000],
    runtime: 'node24',
  });
 
  console.log(`Installing dependencies...`);
  const install = await sandbox.runCommand({
    cmd: 'npm',
    args: ['install', '--loglevel', 'info'],
    stderr: process.stderr,
    stdout: process.stdout,
  });
 
  if (install.exitCode != 0) {
    console.log('installing packages failed');
    process.exit(1);
  }
 
  console.log(`Starting the development server...`);
  await sandbox.runCommand({
    cmd: 'npm',
    args: ['run', 'dev'],
    stderr: process.stderr,
    stdout: process.stdout,
    detached: true,
  });
 
  await setTimeout(500);
  spawn('open', [sandbox.domain(3000)]);
}
 
main().catch(console.error);
Start the sandbox
Run the following command in your terminal:

terminal
node --env-file .env.local --experimental-strip-types ./next-dev.ts
Once the application opens in your browser, you can view the logs in the terminal as you interact with it.

Access the sandbox
The script opens the next dev server in your browser. The public URL is resolved using the sandbox.domain(3000) method.

You'll see the development server logs streaming in real-time to your terminal as you interact with the application.

Stop the sandbox
To stop a sandbox, you can:

Navigate to the Observability tab of your project
Find your sandbox in the list, and click Stop
If you do not stop the sandbox, it will stop after the 10 minute timeout has elapsed.

The SDK also provides the stop method to programmatically stop a running sandbox.

Authentication
Vercel OIDC token
The SDK uses Vercel OIDC tokens to authenticate whenever available. This is the most straightforward and recommended way to authenticate.

When developing locally, you can download a development token to .env.local using vercel env pull. After 12 hours the development token expires, meaning you will have to call vercel env pull again.

In production, Vercel manages token expiration for you.

Using access tokens
If you want to use the SDK from an environment where VERCEL_OIDC_TOKEN is unavailable, you can also authenticate using an access token. You will need

your Vercel team ID
your Vercel project ID
a Vercel access token with access to the above team
Set your team ID, project ID, and token to the environment variables VERCEL_TEAM_ID, VERCEL_PROJECT_ID, and VERCEL_TOKEN. Then pass these to the create method:

TypeScript
Python
const sandbox = await Sandbox.create({
  teamId: process.env.VERCEL_TEAM_ID!,
  projectId: process.env.VERCEL_PROJECT_ID!,
  token: process.env.VERCEL_TOKEN!,
  source: {
    url: 'https://github.com/vercel/sandbox-example-next.git',
    type: 'git',
  },
  resources: { vcpus: 4 },
  timeout: ms('5m'), // timeout in milliseconds: ms('5m') = 300000
  ports: [3000],
  runtime: 'node24',
});
System specifications
Sandbox includes a node24, node22 and python3.13 image. In both of these images:

User code is executed as the vercel-sandbox user.
The default working directory is /vercel/sandbox.
sudo access is available.
Runtime	Package managers
node24	/vercel/runtimes/node24	npm, pnpm
node22	/vercel/runtimes/node22	npm, pnpm
python3.13	/vercel/runtimes/python	pip, uv
Available packages
The base system is Amazon Linux 2023 with the following additional packages:

bind-utils bzip2 findutils git gzip iputils libicu libjpeg libpng ncurses-libs openssl openssl-libs procps tar unzip which whois zstd
Users can install additional packages using the dnf package manager:

TypeScript
Python
install-packages.ts
import { Sandbox } from '@vercel/sandbox';
 
const sandbox = await Sandbox.create();
await sandbox.runCommand({
  cmd: 'dnf',
  args: ['install', '-y', 'golang'],
  sudo: true,
});
You can find the list of available packages on the Amazon Linux documentation.

Sudo config
The sandbox sudo configuration is designed to be easy to use:

HOME is set to /root. Commands executed with sudo will source root's configuration files (e.g. .gitconfig, .bashrc, etc).
PATH is left unchanged. Local or project-specific binaries will still be available when running with elevated privileges.
The executed command inherits all other environment variables that were set.
Observability
To view sandboxes that were started per project, inspect the command history and view the sandbox URLs, access the Sandboxes insights page by:

From the Vercel dashboard, go to the project where you created the sandbox
Click the Observability tab
Click Sandboxes on the left side of the Observability page
To track compute usage for your sandboxes across projects, go to the Usage tab of your Vercel dashboard.

-------

Sandbox CLI Reference
Last updated November 7, 2025
The Sandbox CLI, based on the Docker CLI, allows you to manage sandboxes, execute commands, copy files, and more from your terminal. This page provides a complete reference for all available commands.

Use the CLI for manual testing and debugging, or use the SDK to automate sandbox workflows in your application.

Installation
Install the Sandbox CLI globally to use all commands:

Terminal

pnpm i -g sandbox
Authentication
Log in to use Vercel Sandbox:

Terminal
sandbox login
sandbox --help
Get help information for all available sandbox commands:

terminal
sandbox <subcommand>
Description: Interfacing with Vercel Sandbox

Available subcommands:

list: List all sandboxes for the specified account and project. [alias: ls]
create: Create a sandbox in the specified account and project.
copy: Copy files between your local filesystem and a remote sandbox [alias: cp]
exec: Execute a command in an existing sandbox
stop: Stop one or more running sandboxes [aliases: rm, remove]
run: Create and run a command in a sandbox
login: Log in to the Sandbox CLI
logout: Log out of the Sandbox CLI
For more help, try running sandbox <subcommand> --help

sandbox list
List all sandboxes for the specified account and project.

terminal
sandbox list [OPTIONS]
Example
terminal
# List all running sandboxes
sandbox list
 
# List all sandboxes (including stopped ones)
sandbox list --all
 
# List sandboxes for a specific project
sandbox list --project my-nextjs-app
Options
Option	Alias	Description
--token <token>	-	Your Vercel authentication token. If you don't provide it, we'll use a stored token or prompt you to log in.
--project <project>	-	The project name or ID you want to use with this command.
--scope <team>	--team	The team you want to use with this command.
Flags
Flag	Short	Description
--all	-a	Show all sandboxes, including stopped ones (we only show running ones by default).
--help	-h	Display help information.
sandbox run
Create and run a command in a sandbox.

terminal
sandbox run [OPTIONS] <command> [...args]
Example
terminal
# Run a simple Node.js script
sandbox run -- node --version
 
# Run with custom environment and timeout
sandbox run --env NODE_ENV=production --timeout 10m -- npm start
 
# Run interactively with port forwarding
sandbox run --interactive --publish-port 3000 --tty npm run dev
 
# Run with auto-cleanup
sandbox run --rm -- python3 script.py
Options
Option	Alias	Description
--token <token>	-	Your Vercel authentication token. If you don't provide it, we'll use a stored token or prompt you to log in.
--project <project>	-	The project name or ID you want to use with this command.
--scope <team>	--team	The team you want to use with this command.
--runtime <runtime>	-	Choose between Node.js ('node22') or Python ('python3.13'). We'll use Node.js by default.
--timeout <duration>	-	How long the sandbox can run before we automatically stop it. Examples: '5m', '1h'. We'll stop it after 5 minutes by default.
--publish-port <port>	-p	Make a port from your sandbox accessible via a public URL.
--workdir <directory>	-w	Set the directory where you want the command to run.
--env <key=value>	-e	Set environment variables for your command.
Flags
Flag	Short	Description
--sudo	-	Run the command with admin privileges.
--interactive	-i	Run the command in an interactive shell.
--tty	-t	Enable terminal features for interactive commands.
--rm	-	Automatically delete the sandbox when the command finishes.
--help	-h	Display help information.
Arguments
Argument	Description
<command>	The command you want to run.
[...args]	Additional arguments for your command.
sandbox create
Create a sandbox in the specified account and project.

terminal
sandbox create [OPTIONS]
Example
terminal
# Create a basic Node.js sandbox
sandbox create
 
# Create a Python sandbox with custom timeout
sandbox create --runtime python3.13 --timeout 1h
 
# Create sandbox with port forwarding
sandbox create --publish-port 8080 --project my-app
 
# Create sandbox silently (no output)
sandbox create --silent
Options
Option	Alias	Description
--token <token>	-	Your Vercel authentication token. If you don't provide it, we'll use a stored token or prompt you to log in.
--project <project>	-	The project name or ID you want to use with this command.
--scope <team>	--team	The team you want to use with this command.
--runtime <runtime>	-	Choose between Node.js ('node22') or Python ('python3.13'). We'll use Node.js by default.
--timeout <duration>	-	How long the sandbox can run before we automatically stop it. Examples: '5m', '1h'. We'll stop it after 5 minutes by default.
--publish-port <port>	-p	Make a port from your sandbox accessible via a public URL.
Flags
Flag	Short	Description
--silent	-	Create the sandbox without showing you the sandbox ID.
--help	-h	Display help information.
sandbox exec
Execute a command in an existing sandbox.

terminal
sandbox exec [OPTIONS] <sandbox_id> <command> [...args]
Example
terminal
# Execute a simple command in a sandbox
sandbox exec sb_1234567890 ls -la
 
# Run with environment variables
sandbox exec --env DEBUG=true sb_1234567890 npm test
 
# Execute interactively with sudo
sandbox exec --interactive --sudo sb_1234567890 bash
 
# Run command in specific working directory
sandbox exec --workdir /app sb_1234567890 python script.py
Options
Option	Alias	Description
--token <token>	-	Your Vercel authentication token. If you don't provide it, we'll use a stored token or prompt you to log in.
--project <project>	-	The project name or ID you want to use with this command.
--scope <team>	--team	The team you want to use with this command.
--workdir <directory>	-w	Set the directory where you want the command to run.
--env <key=value>	-e	Set environment variables for your command.
Flags
Flag	Short	Description
--sudo	-	Run the command with admin privileges.
--interactive	-i	Run the command in an interactive shell.
--tty	-t	Enable terminal features for interactive commands.
--help	-h	Display help information.
Arguments
Argument	Description
<sandbox_id>	The ID of the sandbox where you want to run the command.
<command>	The command you want to run.
[...args]	Additional arguments for your command.
sandbox stop
Stop one or more running sandboxes.

terminal
sandbox stop [OPTIONS] <sandbox_id> [...sandbox_id]
Example
terminal
# Stop a single sandbox
sandbox stop sb_1234567890
 
# Stop multiple sandboxes
sandbox stop sb_1234567890 sb_0987654321
 
# Stop sandbox for a specific project
sandbox stop --project my-app sb_1234567890
Options
Option	Alias	Description
--token <token>	-	Your Vercel authentication token. If you don't provide it, we'll use a stored token or prompt you to log in.
--project <project>	-	The project name or ID you want to use with this command.
--scope <team>	--team	The team you want to use with this command.
Flags
Flag	Short	Description
--help	-h	Display help information.
Arguments
Argument	Description
<sandbox_id>	The ID of the sandbox you want to stop.
[...sandbox_id]	Additional sandbox IDs to stop.
sandbox copy
Copy files between your local filesystem and a remote sandbox.

terminal
sandbox copy [OPTIONS] <SANDBOX_ID:PATH> <SANDBOX_ID:PATH>
Example
terminal
# Copy file from local to sandbox
sandbox copy ./local-file.txt sb_1234567890:/app/remote-file.txt
 
# Copy file from sandbox to local
sandbox copy sb_1234567890:/app/output.log ./output.log
 
# Copy directory from sandbox to local
sandbox copy sb_1234567890:/app/dist/ ./build/
Options
Option	Alias	Description
--token <token>	-	Your Vercel authentication token. If you don't provide it, we'll use a stored token or prompt you to log in.
--project <project>	-	The project name or ID you want to use with this command.
--scope <team>	--team	The team you want to use with this command.
Flags
Flag	Short	Description
--help	-h	Display help information.
Arguments
Argument	Description
<SANDBOX_ID:PATH>	The source file path (either a local file or sandbox_id:path for remote files).
<SANDBOX_ID:PATH>	The destination file path (either a local file or sandbox_id:path for remote files).
sandbox login
Log in to the Sandbox CLI.

terminal
sandbox login
Example
terminal
# Log in to the Sandbox CLI
sandbox login
Flags
Flag	Short	Description
--help	-h	Display help information.
sandbox logout
Log out of the Sandbox CLI.

terminal
sandbox logout
Example
terminal
# Log out of the Sandbox CLI
sandbox logout
Flags
Flag	Short	Description
--help	-h	Display help information.

-------

Vercel Sandbox examples
Last updated October 23, 2025
Vercel Sandbox is available in Beta on all plans

Learn how to use the Sandbox SDK through real-life examples.

Using a private repository
In this example, you create an isolated environment from a private Git repository by authenticating with a GitHub personal access token or GitHub App token, and run a simple command inside the sandbox.

The Sandbox.create() method initializes the environment with the provided repository and configuration options, including authentication credentials, timeout, and exposed ports. Once created, you can execute commands inside the sandboxed environment using runCommand.

TypeScript
Python
private-repo.ts
import { Sandbox } from '@vercel/sandbox';
import ms from 'ms';
 
async function main() {
  const sandbox = await Sandbox.create({
    source: {
      url: 'https://github.com/vercel/some-private-repo.git',
      type: 'git',
      // For GitHub, you can use a fine grained, classic personal access token or GitHub App installation access token
      username: 'x-access-token',
      password: process.env.GIT_ACCESS_TOKEN!,
    },
    timeout: ms('5m'),
    ports: [3000],
  });
 
  const echo = await sandbox.runCommand('echo', ['Hello sandbox!']);
  console.log(`Message: ${await echo.stdout()}`);
}
 
main().catch(console.error);
GitHub access token options
There are several ways to authenticate with private GitHub repositories.

Fine-grained personal access token
Fine-grained tokens provide repository-specific access and enhanced security:

Go to GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens
Click Generate new token
Configure the token:
Token name: Give it a descriptive name (e.g., "Vercel Sandbox Access")
Expiration: Set an appropriate expiration date
Resource owner: Select your account or organization
Repository access: Choose "Selected repositories" and select your private repo
Repository permissions: Grant at minimum:
Contents: Read (to clone the repository)
Metadata: Read (for basic repository information)
Click "Generate token" and copy the token
Set it as an environment variable and run your sandbox script:
TypeScript
Python
terminal
export GIT_ACCESS_TOKEN=ghp_your_token_here
node --experimental-strip-types ./private-repo.ts
Other Github methods
Create a classic personal access token
Create a GitHub App installation token
Install system packages
You can install system packages using the dnf system package manager:

TypeScript
Python
install-packages.ts
import { Sandbox } from '@vercel/sandbox';
 
const sandbox = await Sandbox.create();
await sandbox.runCommand({
  cmd: 'dnf',
  args: ['install', '-y', 'golang'],
  sudo: true,
});
You can find the list of available packages on the Amazon Linux documentation.

In the example, sudo: true allows the command to run with elevated privileges.

Extend the timeout of a running sandbox
You can extend the timeout of a running sandbox using the extendTimeout method, which takes a duration in milliseconds:

TypeScript
Python
sandbox-timeout.ts
const sandbox = await Sandbox.create({
  // 15 minute timeout
  timeout: 15 * 60 * 1000,
});
 
// Extend by 10 minutes
await sandbox.extendTimeout(10 * 60 * 1000);
You can extend the timeout as many times as you'd like, until the max timeout for your plan has been reached.

--------

Vercel Sandbox pricing and limits
Last updated November 26, 2025
Vercel Sandbox is available in Beta on all plans

Resource limits
Each sandbox can use a maximum of 8 vCPUs with 2 GB of memory allocated per vCPU
Sandboxes have a maximum runtime duration of 5 hours for Pro/Enterprise and 45 minutes for Hobby, with a default of 5 minutes. You can configure this using the timeout option of Sandbox.create().
You can run Node.js or Python runtimes. Review the system specifications.
Sandboxes can have up to 4 open ports.
Pricing
Vercel tracks sandbox usage by:

Active CPU: The amount of CPU time your code consumes, measured in milliseconds. Waiting for I/O (e.g. calling AI models, database queries) does not count towards Active CPU.
Provisioned memory: The memory size of your sandbox instances (in GB), multiplied by the time they are running (measured in hours).
Network bandwidth: The incoming and outgoing network traffic in and out of your sandbox for tasks such as installing packages and sandbox usage by external traffic through the sandbox listening port.
Sandbox creations: The number of times you started a sandbox.
Included allotment
Metric	Monthly amount included for Hobby
CPU (hour)	5
Provisioned Memory (GB-hr)	420
Network (GB)	20
Sandbox creations	5000
You can use sandboxes under Pro and Enterprise plans based on the following regional pricing:

Active CPU time (per hour)	Provisioned Memory (per GB-hr)	Network (per GB)	Sandbox creations (per 1M)
$0.128	$0.0106	$0.15	$0.60
Currently, Vercel Sandbox is only available in the iad1 region.

Maximum runtime duration
Sandboxes can run for up to several hours based on your plan. The default is 5 minutes.

Plan	Duration limit
Hobby	45 minutes
Pro	5 hours
Enterprise	5 hours
You can configure the maximum runtime duration using the timeout option of Sandbox.create() and extend it later using sandbox.extendTimeout():

TypeScript
Python
sandbox-timeout.ts
const sandbox = await Sandbox.create({
  // 3 hours timeout
  timeout: 3 * 60 * 60 * 1000,
});
 
// Extend by 2 hours
await sandbox.extendTimeout(2 * 60 * 60 * 1000);
You can extend the timeout as many times as you need, until the maximum timeout has been reached.

Concurrent sandboxes limit
At any time, based on your plan, you can run up to a maximum number of sandboxes at the same time. You can upgrade if you're on Hobby. For Pro and Enterprise, this limit will only apply during the Beta period.

Plan	Concurrent sandboxes limit
Hobby	10
Pro	2000
Enterprise	2000
Please get in touch with our sales team if you need more concurrent sandboxes.

Sandboxes creation rate limit
The number of vCPUs you can allocate to active sandboxes depends on your plan. If you need more, you can upgrade.

For example, with the Pro plan's 200 vCPUs per minute limit, you can create:

25 large sandboxes (8 vCPUs each) every minute
Or 100 small sandboxes (2 vCPUs each) every minute
Plan	Sandboxes vCPUs allocation limit
Hobby	40 vCPUs/10 minute
Pro	200 vCPUs/minute
Enterprise	400 vCPUs/minute
Please get in touch with our sales team if you need a higher rate of sandboxes vCPUs allocations.