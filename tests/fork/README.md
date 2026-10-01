# Previewnet fork lifecycle check

Run from the repo root. The upstream Previewnet RPC supplies fork state only.
All test transactions go to local Anvil at `127.0.0.1:8547` and are never
broadcast. The runner refuses an occupied port and stops only the Anvil process
it started.

```sh
bash tests/fork/run.sh
```

The test uses checked-in factory and presale ABIs. It impersonates the factory
owner on the local fork to whitelist a local Anvil account, then creates a token
and presales through deployed factory bytecode. Failures are assertions, not
skips. The runner starts a fresh Anvil process for each run.
