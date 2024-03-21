/**
 *
 */
import { expect, describe, test } from 'vitest';
import { findWinner } from '../../src/data/service.game.js';
import { type GameMiddlewareDefinition } from '../../src/middlewares/middleware.game.js';

/**
 *
 */
describe('Test functions and utilities of service game', function () {
  test('Test the winner of a sum of rounds (DRAW)', function () {
    const drawCase: GameMiddlewareDefinition = {
      timestamp: new Date(),
      public_id: '1',
      player1: 'a',
      player2: 'b',
      rounds: [
        { moveP1: 0, dateP1: new Date(), moveP2: 0, dateP2: new Date() },
        { moveP1: 0, dateP1: new Date(), moveP2: 0, dateP2: new Date() },
        { moveP1: 0, dateP1: new Date(), moveP2: 0, dateP2: new Date() },
        { moveP1: 0, dateP1: new Date(), moveP2: 0, dateP2: new Date() },
        { moveP1: 0, dateP1: new Date(), moveP2: 0, dateP2: new Date() },
      ]
    }

    findWinner(drawCase);

    expect(drawCase.winner).toBe(0);
  });

  test('Test the winner of the sum of rounds (P1 WIN)', function () {
    const drawCase: GameMiddlewareDefinition = {
      timestamp: new Date(),
      public_id: '1',
      player1: 'a',
      player2: 'b',
      rounds: [
        { moveP1: 1, dateP1: new Date(), moveP2: 0, dateP2: new Date() },
        { moveP1: 0, dateP1: new Date(), moveP2: 0, dateP2: new Date() },
        { moveP1: 0, dateP1: new Date(), moveP2: 0, dateP2: new Date() },
        { moveP1: 0, dateP1: new Date(), moveP2: 0, dateP2: new Date() },
        { moveP1: 0, dateP1: new Date(), moveP2: 0, dateP2: new Date() },
      ]
    }

    findWinner(drawCase);

    expect(drawCase.winner).toBe(1);
  });

  test('Test the winner of the sum of rounds (P2 WIN)', function () {
    const drawCase: GameMiddlewareDefinition = {
      timestamp: new Date(),
      public_id: '1',
      player1: 'a',
      player2: 'b',
      rounds: [
        { moveP1: 1, dateP1: new Date(), moveP2: 2, dateP2: new Date() },
        { moveP1: 0, dateP1: new Date(), moveP2: 0, dateP2: new Date() },
        { moveP1: 0, dateP1: new Date(), moveP2: 0, dateP2: new Date() },
        { moveP1: 0, dateP1: new Date(), moveP2: 0, dateP2: new Date() },
        { moveP1: 0, dateP1: new Date(), moveP2: 0, dateP2: new Date() },
      ]
    }

    findWinner(drawCase);

    expect(drawCase.winner).toBe(2);
  });
});
