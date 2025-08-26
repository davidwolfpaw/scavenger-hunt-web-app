
    /**
     * @return {{
     *  name: string,
     *  scans: {tag_id: string, timestamp: Date},
     *  complete: boolean
     * } | undefined}
     */
async function getCompletionStatus(userId){
    const completionRequest = await fetch(`/user/${encodeURIComponent(userId)}/completion`);

    if(!completionRequest.ok){
        return undefined
    }
    /**
     * @type {{
     *  name: string,
     *  scans: {tag_id: string, timestamp: string}[],
     *  complete: boolean
     * }}
     */
    const completion = await completionRequest.json();

    completion.scans = completion.scans.map((scan)=>{
        return {
            tag_id: scan.tag_id,
            timestamp: new Date(scan.timestamp)
        }
    }).sort((a,b)=>a.timestamp.getTime() - b.timestamp.getTime());
    
    return completion;
}




/**
 * 
 * @param {{tag_id: string; timestamp: Date;}[]} scans 
 */
function populateScans(scans){

    const content = document.getElementById('view-content');

    const scansList = document.createElement('table');

    scansList.innerHTML = `
      <thead>
        <tr>
          <th>Tag</th>
          <th>Completed At</th>
        </tr>
      </thead>
      <tbody>
        ${scans.map(scan=>{
            return `
            <tr data-identifier="${scan.tag_id}" data-name="${scan.tag_id}">
                <td>${scan.tag_id}</td>
                <td>${scan.timestamp.toLocaleString()}</td>
            </tr>`
        }).join('')}
      </tbody>
    `
    content.appendChild(scansList);
}

document.addEventListener("DOMContentLoaded", async ()=>{
    const url = new URL(document.location.href);
    if(!url.searchParams.has('user')){
        // IDK MAN
        return;
    }
    const userId = url.searchParams.get('user');

    const completion = await getCompletionStatus(userId)

    if(!completion){
        document.getElementById('username').innerText = "Invalid User";
        document.getElementById('badgeName').innerText = "";
        return;
    }

    document.getElementById('username').innerText = completion.name;
    document.getElementById('badgeName').innerText = userId;

    const content = document.getElementById('view-content');

    const completionText = document.createElement('div');
    
    completionText.classList.add('completion');
    if(completion.completed){
        completionText.classList.add('complete');
        completionText.innerText = "Completed!"
    }else{
        completionText.innerText = "Not done yet!"
        completionText.classList.add('not-complete');
    }
    content.appendChild(completionText)

    populateScans(completion.scans)
})