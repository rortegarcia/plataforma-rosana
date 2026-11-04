import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import vm from 'node:vm';
test('only promoted workshops are scheduled, with fortnightly sessions and unknown January starts withheld',async()=>{
const data=await readFile(new URL('../public/workshops-data.js',import.meta.url),'utf8'),script=await readFile(new URL('../public/workshops.js',import.meta.url),'utf8');const context=vm.createContext({Intl,Date});vm.runInContext(data+script.slice(0,script.indexOf('const es=')),context);
const workshops=vm.runInContext('workshops',context),events=vm.runInContext('workshopCalendarEvents()',context);
const allowed=['garcia-lorca','cien-anos-de-soledad','memorias-postumas'];
for(const w of workshops){assert.equal(w.upcoming,!allowed.includes(w.id));if(w.upcoming){assert.equal(w.hideDates,true);assert.equal(w.calendarDates.length,0);assert(w.intro[0]);assert(w.facts.length);assert(!events.some(e=>e.w.id===w.id));}}
const lorca=events.filter(e=>e.w.id==='garcia-lorca');assert.equal(lorca.length,3);assert.deepEqual(Array.from(lorca,e=>e.date),['2026-11-14','2026-11-28','2026-12-12']);for(const e of lorca)assert.equal(new Date(e.date+'T12:00Z').getUTCDay(),6);
for(const group of [1,2]){const dates=events.filter(e=>e.w.id==='cien-anos-de-soledad'&&e.group===group);assert(dates.length>2);for(let i=1;i<dates.length;i++)assert.equal((new Date(dates[i].date)-new Date(dates[i-1].date))/86400000,14);}
const machado=workshops.find(w=>w.id==='memorias-postumas');assert.equal(machado.startMonth,'2027-01');assert.equal(machado.lengthCategory,2);assert.equal(machado.calendarStartsOnly,true);assert(!events.some(e=>e.w.id===machado.id));
const starts=[{date:'2027-01-06',group:1,spain:'19:00',brazil:'15:00'},{date:'2027-01-20',group:1,spain:'19:00',brazil:'15:00'},{date:'2027-01-09',group:2,spain:'16:30',brazil:'12:30'},{date:'2027-01-23',group:2,spain:'16:30',brazil:'12:30'}];
machado.calendarDates=starts;assert.deepEqual(Array.from(vm.runInContext('workshopCalendarEvents()',context).filter(e=>e.w.id==='memorias-postumas'),e=>e.date),['2027-01-06','2027-01-09']);
});
