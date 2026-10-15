# Testing

Run the automated baseline suite with:

```sh
npm test
```

The current suite covers card dealing, game lifecycle transitions, command validation, state publication, and state export in `server/tests`.

Browser smoke tests are not automated yet. They require a running server and Redis instance; adding a disposable test fixture is part of the next testing pass.
