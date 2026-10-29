import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advancePlayback } from './playback';

test('playback uses elapsed time at uneven frame intervals and the selected rate', () => {
  let seconds=0;
  for(const ms of [40,60,100,50,250,200,100,200]) seconds=advancePlayback(seconds,ms,5,100);
  assert.equal(seconds,5);
});
test('background and invalid gaps do not advance the exercise; finish stays bounded', () => {
  for(const gap of [300,60000,-1,NaN,Infinity]) assert.equal(advancePlayback(10,gap,30,100),10);
  assert.equal(advancePlayback(99,100,30,100),100);
  assert.equal(advancePlayback(10,0,1,100),10);
});
