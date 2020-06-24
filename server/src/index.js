import express from 'express';
import { createServer } from 'http';
import { PubSub } from 'apollo-server';
import { ApolloServer, gql } from 'apollo-server-express';
import { differentFirstResponse } from './differentFirstResponse'

const app = express();

const pubsub = new PubSub();
const MESSAGE_CREATED = 'MESSAGE_CREATED';

const typeDefs = gql`
  type Query {
    messages: [Message!]!
  }

  type Subscription {
    messageCreated: Message
  }

  interface Message {
    id: String
    content: String
  }

  type InitialMessage implements Message {
    id: String
    content: String
    testing: Int
  }

  type NormalMessage implements Message {
    id: String
    content: String
  }
`;

const resolvers = {
  Query: {
    messages: () => [
      { id: 0, content: 'Hello!' },
      { id: 1, content: 'Bye!' },
    ],
  },
  Subscription: {
    messageCreated: {
      // subscribe: () => pubsub.asyncIterator(MESSAGE_CREATED),
      subscribe: differentFirstResponse(
        () => pubsub.asyncIterator(MESSAGE_CREATED),
        () => ({
          messageCreated: {
            __typename: 'InitialMessage',
            id: getTestId(),
            content: `First message before ${id}!`,
            testing: 12345
          }
        }),
      ),
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.applyMiddleware({ app, path: '/graphql' });

const httpServer = createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen({ port: 8000 }, () => {
  console.log('Apollo Server on http://localhost:8000/graphql');
});

let id = 2;

setInterval(() => {
  pubsub.publish(MESSAGE_CREATED, {
    messageCreated: {
      __typename: 'NormalMessage',
      id,
      content: new Date().toString()
    },
  });

  id++;
}, 1000);

let testId = 0

setInterval(() => {
  testId--;
}, 1000);

function getTestId() { return testId }
