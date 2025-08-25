const { expect } = require('chai');
const db = require('../server/db');
const fs = require('fs');
const path = require('path');


function sleep(timeout){
    return new Promise(resolve=>{
        setTimeout(()=>resolve(), timeout);
    })
}

describe("Race Condition", ()=>{


    it('should track correct winner', async ()=>{
        // Wait for Database to initalize
        await sleep(500);

        // Create tags
        const tagids = await Promise.all([...new Array(3)].map(async (_, i)=>{
            const id = `test${i}`;
            await db.addTag(id, `Test ${i}`);
            return id;
        }))

        // Create users
        const users = await Promise.all([...new Array(3)].map(async (_, i)=>{
            const unique = `user${i}`;
            const id = await db.registerUser(db, unique, `User ${i}`);
            return {id};
        }))

        // Log User0 getting the first scan 
        await db.logScan(users[0].id, tagids[0]);
        // Sleep >1 second because of SQLite time resolution
        await sleep(1200);

        // User1 gets all the tags, winning the event
        for(let i = 0; i < tagids.length; i++){
            await db.logScan(users[1].id, tagids[i]);
            await sleep(500);
        }

        // User2 gets all the tags, coming in second
        for(let i = 0; i < tagids.length; i++){
            await db.logScan(users[2].id, tagids[i]);
            await sleep(500);
        }
        
        // User0 finally gets the rest, coming in third
        for(let i = 1; i < tagids.length; i++){
            await db.logScan(users[0].id, tagids[i]);
            await sleep(500);
        }

        // Figure out who won
        const firstComplete = await db.getFirstComplete();

        // User1 should be first
        expect(firstComplete[0]['identifier']).to.equal(users[1].id);

        // User2 should be second
        expect(firstComplete[1]['identifier']).to.equal(users[2].id);

        // User0 should be third
        expect(firstComplete[2]['identifier']).to.equal(users[0].id);
        
    }).timeout(6000)
})