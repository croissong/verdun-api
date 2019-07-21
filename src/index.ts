import { ApolloServer } from 'apollo-server';
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import { PrometheusAPI } from './lib/datasource';
import { importSchema } from 'graphql-import'

const typeDefs = importSchema('src/schema.graphql')

// Resolvers define the technique for fetching the types in the
// schema.  We'll retrieve books from the "books" array above.
const resolvers = {
  Query: {
    podStatus: async (_source, {labels, namespaces}, { dataSources }) =>
      dataSources.prometheusAPI.getPodInfo(labels, namespaces),
  },
  PodStatus: {
    ready:  async ({ pod }, {}, { dataSources }) =>
      dataSources.prometheusAPI.getPodReadiness(pod),
    containers:  async ({ pod }, {}, { dataSources }) =>
      dataSources.prometheusAPI.getContainerInfo(pod),
    initContainers:  async ({ pod }, {}, { dataSources }) =>
      dataSources.prometheusAPI.getInitContainers(pod),
  }
};

// In the most basic sense, the ApolloServer can be started
// by passing type definitions (typeDefs) and the resolvers
// responsible for fetching the data for those types.
const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => {
    return {
      prometheusAPI: new PrometheusAPI()
    };
  },
  plugins: [responseCachePlugin()],
  cacheControl: {
    defaultMaxAge: 5
  }
});

// This `listen` method launches a web-server.  Existing apps
// can utilize middleware options, which we'll discuss later.
server.listen().then(({ url }: { url: string }) => {
  console.log(`Server ready at ${url}`);
});
