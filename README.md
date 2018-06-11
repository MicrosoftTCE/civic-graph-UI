# civic-graph-UI
UI for Civic Graph

## Developing

- Install node.js version 6.11.1 on your development environment: https://nodejs.org/

- Clone this GitHub repository:
```sh
git clone https://github.com/MicrosoftTCE/civic-graph-UI.git
```

- Change directories to the cloned repository:
```sh
cd civic-graph-UI
```

- Install dependencies:
```sh
npm install
```

- Start development server:
```sh
npm run serve
```

You should now be able to run Civic Graph locally at http://127.0.0.1:8080/

When you modify any `.js` or `.css` file, reload the website to see your changes take effect.

## Deployment

When you're ready to deploy a new release, do this:

- Generate the new build files (`npm run build`)
- Commit `build/` to `master`
- Push master to GitHub
- [Open a PR](https://github.com/MicrosoftTCE/civic-graph-UI/compare/production...master?expand=1) to pull `master` into `production`
- When the PR is merged, the Azure Web App will pick up the change to the `production` branch

The same could be done for other environments if they are set up (e.g. replace `production` with `staging`).

Yes, it's unideal to commit our build files here, but it will suffice for now before we get continuous delivery (i.e. auotmated build) setup. This is justifiable given the currently infrequent rate of release.
