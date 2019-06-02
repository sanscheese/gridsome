# @gridsome/source-graphql

> GraphQL source for Gridsome. This package is under development and API might change before v1 is released.

## Install

- `yarn add @gridsome/source-graphql`
- `npm install @gridsome/source-graphql`

## Usage

```js
module.exports = {
  plugins: [
    {
      use: "@gridsome/source-graphql",
      options: {
        uri: "https://somegraphqlendpoint.com/api", //GraphQL Endpoint
        token:
          "SOMETOKEN" //bearer token
      }
    }
  ]
};
```
