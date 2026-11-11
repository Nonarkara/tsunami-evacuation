import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EscapeGuide, EscapePlayback, type EscapeGuideProps } from './EscapeGuide';

const noop=()=>{};
const sample:EscapeGuideProps={language:'en',started:true,playing:false,ready:true,state:'moving',remainingM:100,totalM:1000,seconds:700,duration:1000,rate:1,pace:1.4,schematic:true,onStyle:noop,finishSeconds:600,queueSeconds:47,groundElevation:null,waterLevel:20,peak:20,nextTurn:{direction:'right',distanceM:80},onPlay:noop,onReset:noop,onSeek:noop,onRate:noop,onPlan:noop,onReview:noop};

test('water above unknown ground never becomes a claimed flood or safety outcome',()=>{
  const html=renderToStaticMarkup(createElement(EscapeGuide,sample));
  assert.doesNotMatch(html,/overtook|overtaken|above water|water has reached you|You reached|escape-danger/i);
  assert.match(html,/No local wave prediction/);
  assert.match(html,/<b>—<\/b>/);
  assert.match(html,/destination NOT verified/);
  assert.match(html,/In 80 m, turn right/);
  assert.match(html,/1\.4.*m\/s.*model pace/);
});

test('arrival reports selected walker scheduled finish and own queue, independent of later clock',()=>{
  const html=renderToStaticMarkup(createElement(EscapeGuide,{...sample,state:'arrived',seconds:9999}));
  assert.match(html,/Finished at.*\+10:00/);
  assert.match(html,/this walker’s total queue wait.*0:47/);
  assert.doesNotMatch(html,/Finished at.*\+166:39/);
  assert.match(html,/Endpoint unapproved/);
});

test('both languages expose warning action, no waiting for water, and adult help',()=>{
  for(const language of ['en','th'] as const){
    const html=renderToStaticMarkup(createElement(EscapeGuide,{...sample,language}));
    assert.match(html,language==='en'?/Don’t wait to see water/:/ไม่รอเห็นน้ำ/);
    assert.match(html,language==='en'?/ANY ONE/:/อย่างใดอย่างหนึ่ง/);
    assert.match(html,language==='en'?/trusted adult/:/ผู้ใหญ่ที่ไว้ใจ/);
    assert.match(html,/weather.gov\/safety\/tsunami-during/);
    assert.match(html,language==='en'?/not time before a wave/:/ไม่ใช่เวลาก่อนคลื่นมา/);
  }
});

test('started practice shows time to endpoint, clamped past the endpoint',()=>{
  const running=renderToStaticMarkup(createElement(EscapeGuide,{...sample,seconds:100}));
  assert.match(running,/<strong>Time to endpoint<\/strong> \+8:20/);
  const overdue=renderToStaticMarkup(createElement(EscapeGuide,{...sample,seconds:9999}));
  assert.match(overdue,/<strong>Time to endpoint<\/strong> \+0:00/);
  const beforeStart=renderToStaticMarkup(createElement(EscapeGuide,{...sample,started:false,seconds:100}));
  assert.doesNotMatch(beforeStart,/Time to endpoint/);
  const thai=renderToStaticMarkup(createElement(EscapeGuide,{...sample,language:'th',seconds:100}));
  assert.match(thai,/เวลาถึงปลายทาง/);
});

test('Pause stays enabled during terrain stalls, including after the selected walker finishes',()=>{
  for(const state of ['moving','arrived']){
    const html=renderToStaticMarkup(createElement(EscapePlayback,{...sample,state,playing:true,ready:false}));
    const primary=html.slice(0,html.indexOf('</button>'));
    assert.match(primary,/Pause escape practice/);
    assert.doesNotMatch(primary,/disabled/);
  }
  const stopped=renderToStaticMarkup(createElement(EscapePlayback,{...sample,state:'arrived',playing:false,ready:false}));
  assert.match(stopped.slice(0,stopped.indexOf('</button>')),/disabled.*Replay escape practice/);
});
