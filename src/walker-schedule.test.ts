import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { simulate,frame,type RouteData } from './crowd';
import { walkerSchedule } from './rehearsal';
const routes=JSON.parse(readFileSync(new URL('../public/data/rehearsal-routes.json',import.meta.url),'utf8')) as RouteData;
test('walk readout follows the selected person and includes their scheduled node waits',()=>{
  const model=simulate(routes,1500,1.4,2,300),person=model.people.find(p=>p.route===1)!;
  const schedule=walkerSchedule(person,180);
  assert.equal(schedule.finishSeconds,person.finish);
  assert.notEqual(schedule.finishSeconds,model.duration);
  assert.equal(schedule.remainingSeconds,person.finish-180);
  assert.equal(schedule.queueSeconds,person.legs.reduce((n,l)=>n+l.enter-l.arrival,0));
  assert.equal(walkerSchedule(person,person.finish+100).remainingSeconds,0);
  assert.equal(walkerSchedule(person,-1).remainingSeconds,person.finish);
});
test('departure comparison distinguishes people awaiting release from people queued',()=>{
  const immediate=frame(simulate(routes,1500,1.4,2,0),180);
  const delayed=frame(simulate(routes,1500,1.4,2,300),180);
  assert.equal(delayed.queued,0);assert.equal(delayed.pending,1500);
  assert.ok(immediate.queued>delayed.queued);
});
