import { request, gql } from "graphql-request";
const query = gql`
  query GetLine {
    getLine
    getOtherLine
  }
`;

async function run() {
  for (let i = 0; i < 1000; i++) {
    await request("http://localhost:3003/graphql", query).then(console.log);
  }
}

run();
