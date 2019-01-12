/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { graphql } from 'graphql';
import { addMockFunctionsToSchema, makeExecutableSchema } from 'graphql-tools';

import { rootSchema } from '../../../common/graphql/root/schema.gql';
import { sharedSchema } from '../../../common/graphql/shared';
import { Logger } from '../../utils/logger';
import { eventsSchema } from '../events';
import { sourceStatusSchema } from '../source_status/schema.gql';
import { sourcesSchema } from '../sources/schema.gql';
import { getAuthorizationsQueryMock, mockAuthorizationsData } from './authorizations.mock';
import { authorizationsSchema } from './schema.gql';

const testCaseSource = {
  id: 'Test case to query Authorizations',
  query: `
    query AuthorizationsQuery ($timerange: TimerangeInput!, $pagination: PaginationInput!) {
      source(id: "default") {
        Authorizations(timerange: $timerange, pagination: $pagination) {
          totalCount
          edges {
            authorization {
              _id
              failures
              successes
              user
              from
              to {
                id
                ip
                name
              }
              latest
            }
            cursor{
              value
            }
          }
          pageInfo{
            endCursor{
              value
            }
            hasNextPage
          }
        }
      }  
    }
	`,
  variables: {
    timerange: {
      interval: '12h',
      to: 1514782800000,
      from: 1546318799999,
    },
    pagination: {
      limit: 2,
      cursor: null,
    },
  },
  context: {
    req: {
      payload: {
        operationName: 'test',
      },
    },
  },
  expected: {
    data: {
      source: {
        ...mockAuthorizationsData,
      },
    },
  },
};

describe('Test Source Schema', () => {
  // Array of case types
  const cases = [testCaseSource];
  const typeDefs = [
    rootSchema,
    sharedSchema,
    sourcesSchema,
    sourceStatusSchema,
    eventsSchema,
    authorizationsSchema,
  ];
  const mockSchema = makeExecutableSchema({ typeDefs });

  // Here we specify the return payloads of mocked types
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const mocks = {
    Query: () => ({
      ...getAuthorizationsQueryMock(logger),
    }),
  };

  addMockFunctionsToSchema({
    schema: mockSchema,
    mocks,
  });

  cases.forEach(obj => {
    const { id, query, variables, context, expected } = obj;

    test(`${id}`, async () => {
      const result = await graphql(mockSchema, query, null, context, variables);
      return await expect(result).toEqual(expected);
    });
  });
});