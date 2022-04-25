import "reflect-metadata";

import { graphqlUploadExpress } from "graphql-upload";
import { ApolloServer } from "apollo-server-express";
import {
  createApplication,
  createModule,
  ExecutionContext,
  Injectable,
  Scope,
  Injector,
  Inject,
} from "graphql-modules";
import gql from "graphql-tag";
import * as express from "express";
import { memoryUsage } from "process";

const app = express();

app.use(
  "/graphql",
  express.json({ limit: 100000000 }),
  graphqlUploadExpress({
    maxFieldSize: 100000000,
    maxFiles: 10,
  }),
  (err, req, res, next) => {
    if (err) {
      res.send(err);
    }
  }
);

const typeDefs = gql`
  type Query
  extend type Query {
    getLine: String
    getOtherLine: String
  }
`;

class Organ {}

let twoHeartCount = 0;
@Injectable({ scope: Scope.Operation })
class TwoHeart extends Organ {
  constructor() {
    super();
    twoHeartCount++;
    console.log("twoHeartCount:", twoHeartCount);
  }

  getLine() {
    return `
    Hear the children cryin' (one love)
    `;
  }

  onDestroy() {
    twoHeartCount -= 1;
    console.log("twoHeartCount:", twoHeartCount);
  }
}

let oneHeartCount = 0;
@Injectable({ scope: Scope.Operation })
class OneHeart {
  constructor(@Inject(TwoHeart) public SecondHeart: TwoHeart) {
    oneHeartCount++;
    console.log("oneHeartCount:", oneHeartCount);
  }

  getLine() {
    return `
    One love, one heart
    Let's get together and feel all right
    `;
  }

  onDestroy() {
    oneHeartCount -= 1;
    console.log("oneHeartCount:", oneHeartCount);
  }
}

const OneLove = createModule({
  id: "OneLove",
  dirname: __dirname,
  typeDefs,
  resolvers: {
    Query: {
      getLine: (
        _,
        _1,
        { injector }: ExecutionContext & { operationInjector: Injector }
      ) => {
        return injector.get(OneHeart).getLine();
      },
      getOtherLine: (_, _1, { operationInjector }) => {
        return operationInjector.get(TwoHeart).getLine();
      },
    },
  },
});

function getApplication() {
  console.log("getting application");

  return createApplication({
    modules: [OneLove],
    providers: [OneHeart, TwoHeart],
  });
}

function getSchema() {
  console.log("getting schema");
  const application = getApplication();
  const schema = application.createSchemaForApollo();

  return { schema, application };
}
const run = async () => {
  const { application, schema } = getSchema();
  console.log("gotschema");
  const server = new ApolloServer({
    schema,
    context: async (apolloContext, ...rest) => {
      console.log(rest);
      const { injector: operationInjector } =
        application.createOperationController({
          context: {},
          autoDestroy: true,
        });

      return { operationInjector };
    },
    formatResponse: (res) => {
      console.log(memoryUsage());
      (global as any).gc();
      return res;
    },
    introspection: true,
    plugins: [],
  });

  server.start().then(() => {
    console.log("started");
    server.applyMiddleware({ app });
    app.listen({ port: 3003 });
  });
};
console.log("running");
run();
