import Koa from 'koa';
import { ApolloServer } from 'apollo-server-koa';
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import { PrometheusAPI } from './lib/datasource';
import { importSchema } from 'graphql-import';
import { getLogger } from './lib/logger';

const logger = getLogger(__filename);

const typeDefs = importSchema('src/schema.graphql');

const resolvers = {
  Query: {
    podStatus: async (_source, { labels, namespaces }, { dataSources }) =>
      dataSources.prometheusAPI.getPodInfo(labels, namespaces)
  },
  PodStatus: {
    ready: async ({ pod }, {}, { dataSources }) =>
      dataSources.prometheusAPI.getPodReadiness(pod),
    containers: async ({ pod }, {}, { dataSources }) =>
      dataSources.prometheusAPI.getContainerInfo(pod),
    initContainers: async ({ pod }, {}, { dataSources }) =>
      dataSources.prometheusAPI.getInitContainers(pod)
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => {
    return {
      prometheusAPI: new PrometheusAPI()
    };
  },
  introspection: true,
  playground: true,
  plugins: [responseCachePlugin()],
  cacheControl: {
    defaultMaxAge: 5
  }
});

const app = new Koa();
server.applyMiddleware({ app, path: '/' });

app.listen({ port: 4000, hostName: '0.0.0.0' }, () => {
  logger.info(`Server ready at port 4000 ${server.graphqlPath}`);
});
