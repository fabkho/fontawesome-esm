# FontAwesome Icon Chunks

This project builds individual ES module chunks for FontAwesome Pro Regular SVG icons. This allows for optimized loading of icons by only fetching the specific icons needed, rather than a large bundle.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone git@gitlab.com:anny.co/frontend/packages/fontawesome-chunks.git
    cd fontawesome-chunks
    ```

2.  **Install dependencies:**
    ```bash
    yarn install
    ```

3.  **Configure FontAwesome Token:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file and add your FontAwesome Pro NPM token:
        ```
        // filepath: .env
        FONTAWESOME_NPM_AUTH_TOKEN=YOUR_FONTAWESOME_TOKEN_HERE
        ```
    *   The `.npmrc` file is configured to use this environment variable during `yarn install`.

## Usage

To build the icon chunks:

```bash
yarn build
```

This command executes the [`scripts/build-fa-icon-chunks.mjs`](/Users/fabiankirchhoff/code/fontawesome-chunks/scripts/build-fa-icon-chunks.mjs) script. The script performs the following steps:
1.  Clears the `dist` directory.
2.  Finds all `fa*.js` icon files within `node_modules/@fortawesome/pro-regular-svg-icons`.
3.  Uses Rollup to process each icon file into a separate ES module.
4.  Outputs the processed chunks into the `dist` directory.

The resulting files in the `dist` directory are ready to be deployed to a CDN or served directly.
